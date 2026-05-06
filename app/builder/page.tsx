"use client";
import { useState } from "react";
import StepIndicator from "@/components/StepIndicator";
import ConceptEditor, { ConceptData } from "@/components/ConceptEditor";
import SynonymReview from "@/components/SynonymReview";
import DatabaseSelector from "@/components/DatabaseSelector";
import ModeToggle from "@/components/ModeToggle";
import QueryPreviewTable from "@/components/QueryPreviewTable";
import CodeWindow from "@/components/CodeWindow";
import ExportPanel from "@/components/ExportPanel";
import { getAllDatabasesWithCustom } from "@/lib/db-config/storage";
import type { GeneratedQueries } from "@/lib/query-builder/generator";

const ZH_DATABASES = new Set(["cnki", "wanfang", "weipu", "sinomed"]);
const EN_DATABASES = new Set(["pubmed", "wos", "scopus", "embase", "ovid_medline"]);

export default function BuilderPage() {
  const [step, setStep] = useState(1);
  const [concepts, setConcepts] = useState<ConceptData[]>([]);
  // Bilingual synonym map: keyword → { zh: string[], en: string[] }
  const [synonymMap, setSynonymMap] = useState<Map<string, { zh: string[]; en: string[] }>>(new Map());
  const [databaseIds, setDatabaseIds] = useState<string[]>([
    "pubmed", "wos", "scopus", "embase", "ovid_medline",
    "cnki", "wanfang", "weipu", "sinomed",
  ]);
  const [mode, setMode] = useState<"code" | "llm">("code");
  const [results, setResults] = useState<GeneratedQueries[]>([]);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("");

  const allDbs = getAllDatabasesWithCustom();

  const handleSynonymsConfirmed = (map: Map<string, { zh: string[]; en: string[] }>) => {
    setSynonymMap(map);
    setStep(3);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      if (mode === "code") {
        // Build concepts with language-specific synonyms based on target databases
        const conceptGroups = concepts.map((c) => ({
          name: c.name,
          keywords: c.keywords,
          // Include both zh and en synonyms so the query generator can pick
          synonyms: c.keywords.map((kw) => ({
            keyword: kw,
            synonymsZh: synonymMap.get(kw)?.zh || [],
            synonymsEn: synonymMap.get(kw)?.en || [],
          })),
        }));

        // Generate per-database: English DBs use en synonyms, Chinese DBs use zh synonyms
        const englishDbIds = databaseIds.filter((id) => EN_DATABASES.has(id));
        const chineseDbIds = databaseIds.filter((id) => ZH_DATABASES.has(id));
        const otherDbIds = databaseIds.filter((id) => !EN_DATABASES.has(id) && !ZH_DATABASES.has(id));

        const allResults: GeneratedQueries[] = [];

        // English databases: use English synonyms
        if (englishDbIds.length > 0) {
          const enConcepts = conceptGroups.map((c) => ({
            name: c.name,
            keywords: c.keywords,
            synonyms: c.synonyms.map((s) => ({ keyword: s.keyword, synonyms: s.synonymsEn })),
          }));
          const enRes = await fetch("/api/generate/code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ concepts: enConcepts, databaseIds: englishDbIds }),
          });
          const enData = await enRes.json();
          allResults.push(...(enData.results || []));
        }

        // Chinese databases: use Chinese synonyms
        if (chineseDbIds.length > 0) {
          const zhConcepts = conceptGroups.map((c) => ({
            name: c.name,
            keywords: c.keywords,
            synonyms: c.synonyms.map((s) => ({ keyword: s.keyword, synonyms: s.synonymsZh })),
          }));
          const zhRes = await fetch("/api/generate/code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ concepts: zhConcepts, databaseIds: chineseDbIds }),
          });
          const zhData = await zhRes.json();
          allResults.push(...(zhData.results || []));
        }

        // Custom databases: use English synonyms as default
        if (otherDbIds.length > 0) {
          const otherConcepts = conceptGroups.map((c) => ({
            name: c.name,
            keywords: c.keywords,
            synonyms: c.synonyms.map((s) => ({ keyword: s.keyword, synonyms: s.synonymsEn })),
          }));
          const otherRes = await fetch("/api/generate/code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ concepts: otherConcepts, databaseIds: otherDbIds }),
          });
          const otherData = await otherRes.json();
          allResults.push(...(otherData.results || []));
        }

        setResults(allResults);
      } else {
        // LLM mode: generate per database
        const llmResults: GeneratedQueries[] = [];
        for (const dbId of databaseIds) {
          const isZh = ZH_DATABASES.has(dbId);
          const syns: Record<string, string[]> = {};
          synonymMap.forEach((v, k) => { syns[k] = isZh ? v.zh : v.en; });

          const res = await fetch("/api/generate/llm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              concepts: concepts.map((c) => ({ name: c.name, terms: c.keywords })),
              topic: topic || concepts.map((c) => c.name).join(", "),
              databaseId: dbId,
              synonymRefs: syns,
            }),
          });
          const data = await res.json();
          if (data.lines) {
            llmResults.push({
              database: dbId,
              lines: data.lines,
              final: data.final,
              totalSteps: data.lines.length + 1,
            });
          }
        }
        setResults(llmResults);
      }
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto">
      <section className="text-center py-16 px-6">
        <h1 className="font-display text-[clamp(28px,4vw,36px)] font-semibold leading-[1.15] tracking-[-0.5px] text-ink mb-2">
          检索式构建器
        </h1>
        <p className="text-base text-muted">5 步完成从关键词到多数据库检索式的生成与导出</p>
      </section>

      <StepIndicator currentStep={step} onStepClick={(s) => { if (s < step) setStep(s); }} />

      <div className="px-6 md:px-12 pb-24">
        {step === 1 && (
          <>
            <h2 className="section-title">概念与关键词</h2>
            <p className="section-sub">定义研究课题的概念分组，每个概念下添加关键词</p>
            <div className="mb-8">
              <label className="block text-[11px] font-medium tracking-[1.5px] uppercase text-muted mb-2">研究课题（可选）</label>
              <input className="text-input w-full" placeholder="如：ACEI 类药物治疗高血压肾病的临床效果" value={topic} onChange={(e) => setTopic(e.target.value)} />
            </div>
            <ConceptEditor concepts={concepts} onChange={setConcepts} />
            <div className="text-right mt-8">
              <button className="btn-primary" disabled={concepts.length === 0 || concepts.every((c) => c.keywords.length === 0)} onClick={() => setStep(2)}>
                下一步：同义词匹配
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="section-title">同义词匹配</h2>
            <p className="section-sub">系统自动匹配中英文双语同义词，分别用于中文和英文数据库</p>
            <SynonymReview
              keywords={concepts.flatMap((c) => c.keywords.map((kw) => ({ term: kw, concept: c.name })))}
              onConfirmed={handleSynonymsConfirmed}
            />
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="section-title">数据库与生成模式</h2>
            <p className="section-sub">选择目标数据库，英文DB使用英文同义词，中文DB使用中文同义词</p>
            <ModeToggle mode={mode} onChange={setMode} />
            <div className="card mb-8">
              <p className="text-[11px] font-medium tracking-[1.5px] uppercase text-muted mb-3">
                目标数据库 <span className="font-normal normal-case tracking-normal">({databaseIds.length}/9 选中)</span>
              </p>
              <DatabaseSelector databases={allDbs} selected={databaseIds}
                onToggle={(id) => setDatabaseIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
              />
            </div>
            <div className="text-right">
              <button className="btn-primary" disabled={databaseIds.length === 0 || loading} onClick={handleGenerate}>
                {loading ? "生成中..." : "生成检索式"}
              </button>
            </div>
          </>
        )}

        {step >= 4 && results.length > 0 && (
          <>
            <h2 className="section-title mt-12">检索式预览</h2>
            <p className="section-sub">多数据库检索式对比表 — 英文DB使用英文检索词，中文DB使用中文检索词</p>
            <QueryPreviewTable results={results} />
            <div className="flex justify-end gap-3 mt-4">
              <button className="btn-secondary btn-sm" onClick={() => setStep(3)}>返回调整</button>
              <button className="btn-primary btn-sm" onClick={() => setStep(5)}>确认，准备导出</button>
            </div>
            <div className="mt-16">
              <h2 className="section-title">检索式代码视图</h2>
              <p className="section-sub">单数据库完整检索式，支持复制</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.slice(0, 4).map((r) => (
                  <CodeWindow key={r.database} title={r.database}
                    code={r.lines.map((l) => `#${l.step} ${l.query}`).join("\n\n") + `\n\n${r.final}`} />
                ))}
              </div>
            </div>
          </>
        )}

        {step >= 5 && (
          <>
            <h2 className="section-title mt-16">导出检索策略</h2>
            <p className="section-sub">支持 Excel、CSV、JSON 三种格式</p>
            <ExportPanel results={results} />
          </>
        )}
      </div>
    </div>
  );
}
