export interface SynonymResult {
  standardTerm: string;
  synonyms: string[];
  source: "builtin" | "api" | "custom" | "fuzzy" | "translated";
  confidence: "high" | "medium" | "manual";
}

export interface BilingualSynonymResult {
  originalTerm: string;
  zh: SynonymResult | null;
  en: SynonymResult | null;
}

export interface LLMConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

const cache = new Map<string, BilingualSynonymResult>();

export function getCached(term: string): BilingualSynonymResult | undefined {
  return cache.get(term.toLowerCase());
}

export function setCache(term: string, result: BilingualSynonymResult): void {
  cache.set(term.toLowerCase(), result);
}

export function loadCacheFromStorage(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("synonym-cache-v2");
    if (raw) {
      const entries: [string, BilingualSynonymResult][] = JSON.parse(raw);
      entries.forEach(([k, v]) => cache.set(k, v));
    }
  } catch { /* ignore */ }
}

export function persistCache(): void {
  if (typeof window === "undefined") return;
  const entries = Array.from(cache.entries());
  localStorage.setItem("synonym-cache-v2", JSON.stringify(entries));
}
