"use client";

import { useState } from "react";
import { GeneratedQueries } from "@/lib/query-builder/generator";

type ExportFormat = "xlsx" | "csv" | "json";

interface ExportPanelProps {
  results: GeneratedQueries[];
}

const FORMATS: {
  format: ExportFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    format: "xlsx",
    label: "Excel (.xlsx)",
    description: "格式化的 Excel 电子表格，方便编辑和打印",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <line x1="8" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1.5" />
        <line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="1.5" />
        <line x1="8" y1="17" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    format: "csv",
    label: "CSV (.csv)",
    description: "纯文本逗号分隔格式，通用性最强",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path d="M8 10l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="13" y1="16" x2="16" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    format: "json",
    label: "JSON (.json)",
    description: "结构化数据，便于程序读取和二次处理",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <text x="6" y="15" fontSize="9" fill="currentColor" fontFamily="monospace">
          {"{"}"{"}"}
        </text>
      </svg>
    ),
  },
];

export default function ExportPanel({ results }: ExportPanelProps) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExport(format: ExportFormat) {
    setExporting(format);
    setError(null);

    try {
      const res = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `导出失败 (${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `search-queries.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "导出失败");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-semantic-error/10 border border-semantic-error/30 rounded-lg px-4 py-3 text-sm text-semantic-error">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {FORMATS.map(({ format, label, description, icon }) => (
          <button
            key={format}
            type="button"
            onClick={() => handleExport(format)}
            disabled={exporting !== null}
            className="card text-left hover:border-primary hover:shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-center gap-3 mb-3 text-ink group-hover:text-primary transition-colors">
              {icon}
              <span className="font-semibold text-sm">{label}</span>
              {exporting === format && (
                <span className="ml-auto">
                  <svg
                    className="animate-spin h-4 w-4 text-muted"
                    viewBox="0 0 24 24"
                    aria-label="Exporting..."
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray="31.4 31.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              )}
            </div>
            <p className="text-xs text-muted">{description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
