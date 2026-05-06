"use client";

import { useState } from "react";

export interface ConceptData {
  name: string;
  keywords: string[];
}

const BORDER_COLORS = [
  "border-l-primary",
  "border-l-accent-teal",
  "border-l-accent-amber",
];

interface ConceptEditorProps {
  concepts: ConceptData[];
  onChange: (c: ConceptData[]) => void;
}

export default function ConceptEditor({ concepts, onChange }: ConceptEditorProps) {
  const [newKeyword, setNewKeyword] = useState<Record<number, string>>({});

  function addConcept() {
    const count = concepts.length + 1;
    onChange([
      ...concepts,
      { name: `概念 ${count}`, keywords: [] },
    ]);
  }

  function removeConcept(index: number) {
    const next = concepts.filter((_, i) => i !== index);
    onChange(next);
  }

  function updateConceptName(index: number, name: string) {
    const next = concepts.map((c, i) => (i === index ? { ...c, name } : c));
    onChange(next);
  }

  function addKeyword(conceptIndex: number) {
    const kw = (newKeyword[conceptIndex] || "").trim();
    if (!kw) return;
    const next = concepts.map((c, i) => {
      if (i !== conceptIndex) return c;
      if (c.keywords.includes(kw)) return c;
      return { ...c, keywords: [...c.keywords, kw] };
    });
    onChange(next);
    setNewKeyword((prev) => ({ ...prev, [conceptIndex]: "" }));
  }

  function removeKeyword(conceptIndex: number, keyword: string) {
    const next = concepts.map((c, i) => {
      if (i !== conceptIndex) return c;
      return { ...c, keywords: c.keywords.filter((k) => k !== keyword) };
    });
    onChange(next);
  }

  function handleKeywordKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    conceptIndex: number
  ) {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword(conceptIndex);
    }
    // Allow comma as separator too
    if (e.key === ",") {
      e.preventDefault();
      addKeyword(conceptIndex);
    }
  }

  return (
    <div className="space-y-4">
      {concepts.map((concept, ci) => (
        <div
          key={ci}
          className={`bg-surface-card border border-hairline border-l-4 ${BORDER_COLORS[ci % BORDER_COLORS.length]} rounded-lg p-5 transition-colors`}
        >
          <div className="flex items-center gap-3 mb-3">
            <input
              type="text"
              value={concept.name}
              onChange={(e) => updateConceptName(ci, e.target.value)}
              className="text-input flex-1 font-medium"
              placeholder="概念名称"
              aria-label={`Concept ${ci + 1} name`}
            />
            {concepts.length > 1 && (
              <button
                type="button"
                onClick={() => removeConcept(ci)}
                className="btn-secondary btn-sm text-semantic-error hover:border-semantic-error shrink-0"
                aria-label={`Remove concept ${ci + 1}`}
              >
                删除
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-3 min-h-[28px]">
            {concept.keywords.length === 0 && (
              <span className="text-sm text-muted-soft italic">暂无关键词，请添加</span>
            )}
            {concept.keywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-canvas border border-hairline rounded-pill text-sm text-ink"
              >
                {kw}
                <button
                  type="button"
                  onClick={() => removeKeyword(ci, kw)}
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-soft hover:text-semantic-error hover:bg-semantic-error/10 transition-colors"
                  aria-label={`Remove keyword "${kw}"`}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                    <line x1="2" y1="2" x2="8" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newKeyword[ci] || ""}
              onChange={(e) =>
                setNewKeyword((prev) => ({ ...prev, [ci]: e.target.value }))
              }
              onKeyDown={(e) => handleKeywordKeyDown(e, ci)}
              className="text-input flex-1"
              placeholder="输入关键词后按回车添加..."
              aria-label={`Add keyword for concept ${ci + 1}`}
            />
            <button
              type="button"
              onClick={() => addKeyword(ci)}
              disabled={!newKeyword[ci]?.trim()}
              className="btn-primary btn-sm shrink-0"
            >
              添加
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addConcept}
        className="btn-secondary w-full"
      >
        + 添加概念组
      </button>
    </div>
  );
}
