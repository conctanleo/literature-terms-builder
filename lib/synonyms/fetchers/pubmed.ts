import { SynonymResult } from "../cache";

async function fetchWithRetry(url: string, retries = 2): Promise<Response | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (res.ok) return res;
      if (res.status === 429) {
        // Rate limited — wait and retry
        await new Promise((r) => setTimeout(r, (i + 1) * 1500));
        continue;
      }
      return null;
    } catch {
      if (i < retries) {
        await new Promise((r) => setTimeout(r, (i + 1) * 1000));
      }
    }
  }
  return null;
}

/**
 * Fetch synonyms from NCBI MeSH database.
 * With retry logic and 15s timeout per request.
 */
export async function fetchMeshSynonyms(term: string): Promise<SynonymResult | null> {
  const baseUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

  // Step 1: Search MeSH for the term
  const searchUrl = `${baseUrl}/esearch.fcgi?db=mesh&term=${encodeURIComponent(term)}&retmax=3&retmode=json`;
  const searchRes = await fetchWithRetry(searchUrl);
  if (!searchRes) return null;

  let searchData: { esearchresult?: { idlist?: string[] } };
  try {
    searchData = await searchRes.json();
  } catch {
    return null;
  }

  const ids: string[] = searchData?.esearchresult?.idlist || [];
  if (ids.length === 0) return null;

  // Step 2: Collect Entry Terms from all returned MeSH records
  const allEntryTerms = new Set<string>();

  for (const id of ids.slice(0, 3)) {
    const fetchUrl = `${baseUrl}/efetch.fcgi?db=mesh&id=${id}&retmode=xml`;
    const fetchRes = await fetchWithRetry(fetchUrl);
    if (!fetchRes) continue;

    const text = await fetchRes.text();

    // Parse the "Entry Terms:" section from plain-text response
    const lines = text.split("\n");
    let inEntryTerms = false;
    for (const line of lines) {
      if (line.startsWith("Entry Terms:")) {
        inEntryTerms = true;
        continue;
      }
      if (inEntryTerms) {
        if (line.startsWith("    ")) {
          const entryTerm = line.trim();
          if (entryTerm && entryTerm.toLowerCase() !== term.toLowerCase()) {
            allEntryTerms.add(entryTerm);
          }
        } else if (line.trim() !== "") {
          inEntryTerms = false;
        }
      }
    }
  }

  if (allEntryTerms.size === 0) return null;

  return {
    standardTerm: term,
    synonyms: Array.from(allEntryTerms),
    source: "api",
    confidence: "high",
  };
}

/**
 * Fallback: when a term has no direct MeSH entry, search PubMed articles
 * and extract the MeSH headings that indexers assigned to those articles.
 * This discovers compound concepts like "Medical Device-Related Pressure Injury"
 * which is indexed via "Pressure Ulcer" + "Equipment and Supplies".
 */
export async function fetchMeshFromPubmedArticles(term: string): Promise<SynonymResult | null> {
  const baseUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

  try {
    const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}[ti]&retmax=5&retmode=json&sort=relevance`;
    const searchRes = await fetchWithRetry(searchUrl);
    if (!searchRes) return null;

    const searchData = await searchRes.json();
    const pmids: string[] = searchData?.esearchresult?.idlist || [];
    if (pmids.length === 0) return null;

    const fetchUrl = `${baseUrl}/efetch.fcgi?db=pubmed&id=${pmids.join(",")}&retmode=xml`;
    const fetchRes = await fetchWithRetry(fetchUrl);
    if (!fetchRes) return null;

    const xml = await fetchRes.text();

    const meshTerms = new Map<string, number>();
    const descriptorRegex = /<DescriptorName[^>]*>([^<]+)<\/DescriptorName>/g;
    let match;
    while ((match = descriptorRegex.exec(xml)) !== null) {
      const mesh = match[1];
      meshTerms.set(mesh, (meshTerms.get(mesh) || 0) + 1);
    }

    if (meshTerms.size === 0) return null;

    const entries: [string, number][] = [];
    meshTerms.forEach((count, term) => entries.push([term, count]));
    // Filter out generic MeSH check tags
    const genericTags = new Set([
      "Humans", "Male", "Female", "Adult", "Middle Aged", "Aged", "Aged, 80 and over",
      "Adolescent", "Child", "Infant", "Infant, Newborn", "Animals", "Mice", "Rats",
      "Retrospective Studies", "Prospective Studies", "Risk Factors", "Reproducibility of Results",
      "Time Factors", "Treatment Outcome", "Follow-Up Studies", "Cohort Studies",
      "Cross-Sectional Studies", "Case-Control Studies", "Pregnancy",
    ]);
    const sorted = entries
      .filter(([t]) => !genericTags.has(t))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([t]) => t);

    return {
      standardTerm: sorted[0],
      synonyms: sorted,
      source: "api",
      confidence: "medium",
    };
  } catch {
    return null;
  }
}
