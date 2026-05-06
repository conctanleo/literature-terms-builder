import { SynonymResult, LLMConfig } from "../cache";

/**
 * LLM-based synonym lookup as final fallback when PubMed MeSH has no results.
 * Used for acronyms, emerging terms, and complex multi-word phrases.
 */
export async function fetchLLMSynonyms(term: string, config?: LLMConfig): Promise<SynonymResult | null> {
  const apiKey = config?.apiKey || process.env.GLM5_API_KEY;
  const baseUrl = config?.baseUrl || process.env.GLM5_BASE_URL || "https://open.bigmodel.cn/api/paas/v4";
  const model = config?.model || process.env.GLM5_MODEL || "glm-5.1";

  if (!apiKey) return null;

  try {
    const systemPrompt = `You are a medical search specialist. Given a clinical term or abbreviation NOT found in MeSH, generate search terms for systematic review database queries.

Rules:
- Expand acronyms to full terms
- Include spelling/hyphenation variants
- Include the closest standard MeSH term(s) used by indexers
- Include British/American variants
- Do NOT include generic tags (Humans, Adult, Risk Factors, Retrospective Studies etc.)
- Return ONLY a JSON array of strings. No other text.

Example: "CRRT" → ["CRRT","Continuous Renal Replacement Therapy","CVVH","Continuous Venovenous Hemofiltration","Continuous Hemodialysis","Renal Replacement Therapy"]
Example: "MDRPI" → ["MDRPI","Medical Device-Related Pressure Injury","Medical Device Related Pressure Ulcer","Device-Related Pressure Ulcer","Medical Device Pressure Ulcer","Hospital-Acquired Pressure Injury"]`;

    const userMessage = `Search terms for: "${term}"`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        thinking: { type: "disabled" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text: string = data.choices?.[0]?.message?.content || "";

    // Extract JSON array from response
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) return null;

    const synonyms: string[] = JSON.parse(jsonMatch[0]);

    // Filter out empty strings and deduplicate
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const s of synonyms) {
      const trimmed = s.trim();
      if (trimmed.length > 0 && !seen.has(trimmed)) {
        seen.add(trimmed);
        unique.push(trimmed);
      }
    }
    if (unique.length === 0) return null;

    return {
      standardTerm: unique[0],
      synonyms: unique,
      source: "custom", // marked as custom since it's LLM-generated
      confidence: "medium",
    };
  } catch {
    return null;
  }
}

/**
 * LLM-based single-term medical translation.
 * Used as fallback when the built-in bilingual map has no entry.
 */
export async function fetchLLMTranslation(
  text: string,
  direction: "zh-to-en" | "en-to-zh",
  config?: LLMConfig
): Promise<string | null> {
  const apiKey = config?.apiKey || process.env.GLM5_API_KEY;
  const baseUrl = config?.baseUrl || process.env.GLM5_BASE_URL || "https://open.bigmodel.cn/api/paas/v4";
  const model = config?.model || process.env.GLM5_MODEL || "glm-5.1";

  if (!apiKey) return null;

  try {
    const systemPrompt = direction === "zh-to-en"
      ? `You are a medical translator. Translate the given Chinese medical term into its standard English equivalent used in PubMed/MeSH. Return ONLY the English translation as a single plain text string. No explanation, no JSON, no brackets.`
      : `You are a medical translator. Translate the given English medical term into its standard Chinese equivalent used in Chinese medical literature. Return ONLY the Chinese translation as a single plain text string. No explanation, no JSON, no brackets.`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        thinking: { type: "disabled" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Translate: "${text}"` },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const result: string = data.choices?.[0]?.message?.content || "";
    const cleaned = result.trim().replace(/^["']|["']$/g, "");

    if (!cleaned || cleaned.length > 200) return null;
    return cleaned;
  } catch {
    return null;
  }
}
