"use client";

import { useState } from "react";

interface CodeWindowProps {
  title: string;
  code: string;
}

function highlightCode(code: string): React.ReactNode[] {
  if (!code) return [];

  // Tokenize the code string
  const pattern = /(#[0-9]+|#[a-zA-Z_][a-zA-Z0-9_]*|AND|OR|NOT|AND\s+NOT|\[[^\]]+\])/g;
  const parts: { text: string; className?: string }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(code)) !== null) {
    // Push text before match
    if (match.index > lastIndex) {
      parts.push({ text: code.slice(lastIndex, match.index) });
    }
    const matched = match[0];

    if (/^#[0-9]/.test(matched)) {
      // Line number references like #1, #2
      parts.push({ text: matched, className: "text-accent-teal" });
    } else if (/^(AND|OR|NOT|AND\s+NOT)$/.test(matched)) {
      // Boolean operators
      parts.push({ text: matched, className: "text-primary" });
    } else if (/^\[[^\]]+\]$/.test(matched)) {
      // Field qualifiers like [tiab], [Title], [mh]
      parts.push({ text: matched, className: "text-accent-amber" });
    } else {
      parts.push({ text: matched });
    }

    lastIndex = pattern.lastIndex;
  }

  // Push remaining text
  if (lastIndex < code.length) {
    parts.push({ text: code.slice(lastIndex) });
  }

  return parts.map((p, i) =>
    p.className ? (
      <span key={i} className={p.className}>
        {p.text}
      </span>
    ) : (
      <span key={i}>{p.text}</span>
    )
  );
}

function getLineNumbers(code: string): number[] {
  const lines = code.split("\n");
  return Array.from({ length: lines.length }, (_, i) => i + 1);
}

export default function CodeWindow({ title, code }: CodeWindowProps) {
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n");
  const lineNumbers = getLineNumbers(code);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="bg-surface-dark rounded-lg overflow-hidden border border-surface-dark-elevated">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-dark-elevated border-b border-surface-dark-soft">
        <div className="flex items-center gap-2.5">
          {/* Traffic light dots */}
          <span className="w-3 h-3 rounded-full bg-semantic-error" />
          <span className="w-3 h-3 rounded-full bg-accent-amber" />
          <span className="w-3 h-3 rounded-full bg-semantic-success" />
        </div>
        <span className="font-mono text-xs text-on-dark-soft">{title}</span>
        <button
          type="button"
          onClick={handleCopy}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-sans transition-colors ${
            copied
              ? "bg-semantic-success/20 text-semantic-success"
              : "text-on-dark-soft hover:text-on-dark hover:bg-surface-dark-soft"
          }`}
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path
                  d="M2.5 6l2.5 2.5 4.5-5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              已复制
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <rect
                  x="3"
                  y="1"
                  width="7"
                  height="9"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="1"
                  fill="none"
                />
                <path
                  d="M1 4v6a1 1 0 001 1h6"
                  stroke="currentColor"
                  strokeWidth="1"
                  fill="none"
                />
              </svg>
              复制
            </>
          )}
        </button>
      </div>

      {/* Code body */}
      <div className="overflow-x-auto">
        <pre className="flex p-4 font-mono text-sm leading-relaxed text-on-dark m-0">
          <code className="select-none text-right pr-4 text-on-dark-soft text-xs border-r border-surface-dark-soft">
            {lineNumbers.map((n) => (
              <span key={n} className="block">
                {n}
              </span>
            ))}
          </code>
          <code className="pl-4 text-on-dark">
            {lines.map((line, i) => (
              <span key={i} className="block">
                {highlightCode(line)}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
