"use client";

import { DatabaseConfig } from "@/lib/db-config/types";

interface DatabaseSelectorProps {
  databases: DatabaseConfig[];
  selected: string[];
  onToggle: (id: string) => void;
}

export default function DatabaseSelector({
  databases,
  selected,
  onToggle,
}: DatabaseSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {databases.map((db) => {
        const isSelected = selected.includes(db.id);
        return (
          <button
            key={db.id}
            type="button"
            onClick={() => onToggle(db.id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
              isSelected
                ? "bg-surface-dark text-on-dark shadow-sm"
                : "bg-canvas text-ink border border-hairline hover:border-muted hover:bg-surface-soft"
            }`}
          >
            <span>{db.nameZh || db.name}</span>
            {db.exportNotes && (
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent-amber/20 text-accent-amber text-[10px]"
                title={db.exportNotes}
              >
                !
              </span>
            )}
            {isSelected && (
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path
                  d="M2.5 6l2.5 2.5 4.5-5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function DatabaseSelectorSkeleton() {
  return (
    <div className="flex flex-wrap gap-2.5">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse h-10 w-24 rounded-md bg-surface-card border border-hairline"
        />
      ))}
    </div>
  );
}
