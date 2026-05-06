"use client";

interface ModeToggleProps {
  mode: "code" | "llm";
  onChange: (m: "code" | "llm") => void;
}

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Generation mode"
      className="inline-flex bg-surface-card border border-hairline rounded-lg p-1 gap-1"
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === "code"}
        onClick={() => onChange("code")}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          mode === "code"
            ? "bg-canvas text-ink shadow-sm"
            : "text-muted hover:text-ink"
        }`}
      >
        代码自动生成
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === "llm"}
        onClick={() => onChange("llm")}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          mode === "llm"
            ? "bg-canvas text-ink shadow-sm"
            : "text-muted hover:text-ink"
        }`}
      >
        LLM 辅助生成
      </button>
    </div>
  );
}
