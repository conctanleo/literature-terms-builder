"use client";

import { useState, useEffect, useCallback } from "react";
import { BilingualSynonymResult, SynonymResult } from "@/lib/synonyms/cache";

interface SynonymReviewProps {
  keywords: { term: string; concept: string }[];
  onConfirmed: (map: Map<string, { zh: string[]; en: string[] }>) => void;
}

export default function SynonymReview({ keywords, onConfirmed }: SynonymReviewProps) {
  const [results, setResults] = useState<Map<string, BilingualSynonymResult>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Selected synonyms: { term: { zh: Set<string>, en: Set<string> } }
  const [selected, setSelected] = useState<Map<string, { zh: Set<string>; en: Set<string> }>>(new Map());
  const [customZh, setCustomZh] = useState<Record<string, string>>({});
  const [customEn, setCustomEn] = useState<Record<string, string>>({});

  const fetchSynonyms = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Get LLM config from localStorage
    const llmConfig = typeof window !== "undefined" ? {
      apiKey: localStorage.getItem("llm-apiKey") || undefined,
      baseUrl: localStorage.getItem("llm-baseUrl") || undefined,
      model: localStorage.getItem("llm-model") || undefined,
    } : {};

    try {
      const newResults = new Map<string, BilingualSynonymResult>();
      await Promise.all(
        keywords.map(async (kw) => {
          try {
            const res = await fetch(`/api/synonyms/lookup?term=${encodeURIComponent(kw.term)}`);
            if (res.ok) {
              const data = await res.json();
              // If no en synonyms found and we have LLM config, try POST with LLM
              if ((!data.en || data.en.synonyms.length === 0) && llmConfig.apiKey) {
                const llmRes = await fetch("/api/synonyms/lookup", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ term: kw.term, llmConfig }),
                });
                if (llmRes.ok) {
                  newResults.set(kw.term, await llmRes.json());
                  return;
                }
              }
              newResults.set(kw.term, data);
            } else {
              newResults.set(kw.term, {
                originalTerm: kw.term,
                zh: { standardTerm: kw.term, synonyms: [], source: "custom", confidence: "manual" },
                en: { standardTerm: kw.term, synonyms: [], source: "custom", confidence: "manual" },
              });
            }
          } catch {
            newResults.set(kw.term, {
              originalTerm: kw.term,
              zh: { standardTerm: kw.term, synonyms: [], source: "custom", confidence: "manual" },
              en: { standardTerm: kw.term, synonyms: [], source: "custom", confidence: "manual" },
            });
          }
        })
      );
      setResults(newResults);

      // Initialize all synonyms as pre-selected
      const newSelected = new Map<string, { zh: Set<string>; en: Set<string> }>();
      newResults.forEach((r, term) => {
        newSelected.set(term, {
          zh: new Set(r.zh?.synonyms || []),
          en: new Set(r.en?.synonyms || []),
        });
      });
      setSelected(newSelected);
    } catch {
      setError("获取同义词时发生错误");
    } finally {
      setLoading(false);
    }
  }, [keywords]);

  useEffect(() => { fetchSynonyms(); }, [fetchSynonyms]);

  function toggleSyn(term: string, lang: "zh" | "en", synonym: string) {
    setSelected((prev) => {
      const next = new Map(prev);
      const current = next.get(term) || { zh: new Set<string>(), en: new Set<string>() };
      const synSet = new Set(current[lang]);
      synSet.has(synonym) ? synSet.delete(synonym) : synSet.add(synonym);
      next.set(term, { ...current, [lang]: synSet });
      return next;
    });
  }

  function addCustom(term: string, lang: "zh" | "en") {
    const input = (lang === "zh" ? customZh[term] : customEn[term])?.trim();
    if (!input) return;
    setSelected((prev) => {
      const next = new Map(prev);
      const current = next.get(term) || { zh: new Set<string>(), en: new Set<string>() };
      const synSet = new Set(current[lang]);
      synSet.add(input);
      next.set(term, { ...current, [lang]: synSet });
      return next;
    });
    if (lang === "zh") setCustomZh((p) => ({ ...p, [term]: "" }));
    else setCustomEn((p) => ({ ...p, [term]: "" }));
  }

  function handleConfirm() {
    const map = new Map<string, { zh: string[]; en: string[] }>();
    selected.forEach((s, term) => {
      map.set(term, { zh: Array.from(s.zh), en: Array.from(s.en) });
    });
    onConfirmed(map);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {keywords.map((kw, i) => (
          <div key={i} className="animate-pulse bg-surface-card rounded-lg p-5">
            <div className="h-5 w-24 bg-surface-cream-strong rounded mb-3" />
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-16 bg-surface-cream-strong rounded" />
                <div className="flex gap-2"><div className="h-6 w-16 bg-surface-cream-strong rounded-pill" /><div className="h-6 w-20 bg-surface-cream-strong rounded-pill" /></div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-16 bg-surface-cream-strong rounded" />
                <div className="flex gap-2"><div className="h-6 w-24 bg-surface-cream-strong rounded-pill" /><div className="h-6 w-20 bg-surface-cream-strong rounded-pill" /></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-semantic-error/10 border border-semantic-error/30 rounded-lg p-5 text-sm text-semantic-error">
        {error}
        <button onClick={fetchSynonyms} className="ml-3 underline hover:no-underline">重试</button>
      </div>
    );
  }

  function SynonymGroup({ lang, label, dbList, result, term }: {
    lang: "zh" | "en";
    label: string;
    dbList: string;
    result: SynonymResult | null;
    term: string;
  }) {
    const synSet = selected.get(term)?.[lang] || new Set<string>();
    const syns = result?.synonyms || [];
    const customInput = lang === "zh" ? customZh : customEn;
    const setCustomInput = lang === "zh" ? setCustomZh : setCustomEn;

    return (
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium tracking-[1.5px] uppercase text-muted">{label}</span>
          <span className="text-[10px] text-muted-soft">{dbList}</span>
          {result && (
            <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-xs ml-auto ${
              result.confidence === "high" ? "bg-semantic-success/15 text-semantic-success"
              : result.confidence === "medium" ? "bg-accent-amber/15 text-accent-amber"
              : "bg-surface-cream-strong text-muted"
            }`}>
              {result.source}{result.confidence !== "high" ? ` · ${result.confidence}` : ""}
            </span>
          )}
        </div>

        {syns.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {syns.map((syn) => {
              const isSel = synSet.has(syn);
              return (
                <button key={syn} type="button" onClick={() => toggleSyn(term, lang, syn)}
                  className={`inline-flex items-center px-2 py-0.5 rounded-pill text-xs transition-colors ${
                    isSel ? "bg-semantic-success/15 text-semantic-success border border-semantic-success/30"
                    : "bg-canvas text-muted border border-hairline hover:border-muted"
                  }`}>
                  {syn}
                </button>
              );
            })}
          </div>
        )}

        {syns.length === 0 && (
          <p className="text-xs text-muted-soft italic mb-2">
            {result?.source === "translated" ? "翻译获取中..." : "未匹配到同义词"}
          </p>
        )}

        <div className="flex gap-1.5">
          <input type="text" value={customInput[term] || ""}
            onChange={(e) => setCustomInput((p: Record<string, string>) => ({ ...p, [term]: e.target.value }))}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(term, lang); } }}
            className="text-input flex-1 text-xs h-8"
            placeholder={lang === "zh" ? "添加中文同义词..." : "Add English synonym..."}
          />
          <button type="button" onClick={() => addCustom(term, lang)}
            disabled={!customInput[term]?.trim()}
            className="btn-secondary btn-xs shrink-0">添加</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {keywords.map((kw) => {
        const result = results.get(kw.term);

        return (
          <div key={kw.term} className="bg-surface-card border border-hairline rounded-lg p-5">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center px-2.5 py-0.5 bg-primary/15 text-primary rounded-pill text-sm font-medium">
                {kw.term}
              </span>
              <span className="text-xs text-muted-soft">from</span>
              <span className="text-sm font-medium text-ink">{kw.concept}</span>
            </div>

            {/* Bilingual synonym groups */}
            <div className="flex gap-6">
              <SynonymGroup
                lang="zh" label="中文同义词"
                dbList="CNKI · 万方 · 维普 · Sinomed"
                result={result?.zh || null} term={kw.term}
              />
              <div className="w-px bg-hairline-soft shrink-0" />
              <SynonymGroup
                lang="en" label="English Synonyms"
                dbList="PubMed · WOS · Scopus · Embase · Ovid"
                result={result?.en || null} term={kw.term}
              />
            </div>
          </div>
        );
      })}

      <button type="button" onClick={handleConfirm} className="btn-primary w-full">
        确认同义词匹配
      </button>
    </div>
  );
}
