import { getCached, setCache, BilingualSynonymResult, SynonymResult, LLMConfig } from "./cache";
import { fetchMeshSynonyms } from "./fetchers/pubmed";
import { fetchLLMSynonyms } from "./fetchers/llm";
import { translateZhToEn, translateEnToZh } from "./fetchers/zh-en-medical-map";
import meshData from "@/data/builtin-thesauri/mesh-en.json";
import sinomedData from "@/data/builtin-thesauri/sinomed-zh.json";

type ThesaurusEntry = { term: string; synonyms: string[] };

function hasCJK(text: string): boolean {
  return /[一-鿿㐀-䶿豈-﫿]/.test(text);
}

function searchBuiltin(term: string, entries: ThesaurusEntry[]): SynonymResult | null {
  const lower = term.toLowerCase();
  for (const entry of entries) {
    if (entry.term.toLowerCase() === lower || entry.synonyms.some((s) => s.toLowerCase() === lower)) {
      return {
        standardTerm: entry.term,
        synonyms: entry.synonyms.filter((s) => s.toLowerCase() !== lower),
        source: "builtin",
        confidence: "high",
      };
    }
  }
  return null;
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function fuzzyMatch(term: string, entries: ThesaurusEntry[]): SynonymResult | null {
  const lower = term.toLowerCase();
  if (lower.length < 4) return null;
  for (const entry of entries) {
    const allTerms = [entry.term, ...entry.synonyms];
    for (const t of allTerms) {
      if (levenshteinDistance(lower, t.toLowerCase()) <= 2) {
        return {
          standardTerm: entry.term,
          synonyms: entry.synonyms.filter((s) => s.toLowerCase() !== lower),
          source: "fuzzy",
          confidence: "manual",
        };
      }
    }
  }
  return null;
}

function emptyResult(term: string): SynonymResult {
  return { standardTerm: term, synonyms: [], source: "custom", confidence: "manual" };
}

function wrapTranslated(synonyms: string[], standardTerm: string): SynonymResult {
  return { standardTerm, synonyms, source: "translated", confidence: "medium" };
}

// Find Chinese synonyms for a term
async function findZhSynonyms(term: string, enTermForReverse: string | null, llmConfig?: LLMConfig): Promise<SynonymResult> {
  // 1. Built-in Sinomed lookup (direct)
  let result = searchBuiltin(term, sinomedData);
  if (result) return result;

  // 2. If we have an English translation, try reverse lookup in Sinomed
  if (enTermForReverse) {
    const zhFromEn = await translateEnToZh(enTermForReverse, llmConfig);
    if (zhFromEn) {
      result = searchBuiltin(zhFromEn, sinomedData);
      if (result) return wrapTranslated(result.synonyms, result.standardTerm);

      // No direct match — use the translation as a fallback synonym
      return wrapTranslated([zhFromEn], zhFromEn);
    }
    // No translation available
    return emptyResult(term);
  }

  // 3. Fuzzy match in Sinomed
  result = fuzzyMatch(term, sinomedData);
  if (result) return result;

  // 4. Try fuzzy match with English translation
  if (enTermForReverse) {
    result = fuzzyMatch(enTermForReverse, sinomedData);
    if (result) return wrapTranslated(result.synonyms, result.standardTerm);
  }

  // 5. LLM fallback for Chinese terms too
  const llmResult = await fetchLLMSynonyms(term, llmConfig);
  if (llmResult) return llmResult;

  return emptyResult(term);
}

// Find English synonyms for a term
async function findEnSynonyms(term: string, zhTermForReverse: string | null, llmConfig?: LLMConfig): Promise<SynonymResult> {
  // 1. Built-in MeSH lookup (direct)
  let result = searchBuiltin(term, meshData);
  if (result) return result;

  // 2. PubMed MeSH API lookup
  result = await fetchMeshSynonyms(term);
  if (result) return result;

  // 3. If we have a Chinese translation, translate it and search MeSH + API
  if (zhTermForReverse) {
    const enFromZh = await translateZhToEn(zhTermForReverse, llmConfig);
    if (enFromZh) {
      result = searchBuiltin(enFromZh, meshData);
      if (result) return wrapTranslated(result.synonyms, result.standardTerm);

      result = await fetchMeshSynonyms(enFromZh);
      if (result) return { ...result, source: "translated" as const, confidence: "medium" as const };

      // API failed but we have a translation — use it as a fallback synonym
      return wrapTranslated([enFromZh], enFromZh);
    }
    // No translation available — return empty so keyword doesn't leak
    return emptyResult(term);
  }

  // 4. Fuzzy match in MeSH
  result = fuzzyMatch(term, meshData);
  if (result) return result;

  // 5. LLM fallback — ask LLM to expand acronyms and unknown terms
  const llmResult = await fetchLLMSynonyms(term, llmConfig);
  if (llmResult) return llmResult;

  return emptyResult(term);
}

export async function findBilingualSynonyms(term: string, llmConfig?: LLMConfig): Promise<BilingualSynonymResult> {
  const cached = getCached(term);
  if (cached) return cached;

  const isZh = hasCJK(term);
  let result: BilingualSynonymResult;

  if (isZh) {
    const [zhResult, enResult] = await Promise.all([
      findZhSynonyms(term, null, llmConfig),
      findEnSynonyms(term, term, llmConfig),
    ]);
    result = { originalTerm: term, zh: zhResult, en: enResult };
  } else {
    const [enResult, zhResult] = await Promise.all([
      findEnSynonyms(term, null, llmConfig),
      findZhSynonyms(term, term, llmConfig),
    ]);
    result = { originalTerm: term, zh: zhResult, en: enResult };
  }

  setCache(term, result);
  return result;
}

export async function batchFindBilingualSynonyms(
  keywords: { term: string; concept: string }[]
): Promise<Map<string, BilingualSynonymResult>> {
  const results = new Map<string, BilingualSynonymResult>();
  await Promise.all(
    keywords.map(async (kw) => {
      results.set(kw.term, await findBilingualSynonyms(kw.term));
    })
  );
  return results;
}
