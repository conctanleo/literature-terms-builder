"use client";

import { GeneratedQueries } from "@/lib/query-builder/generator";

interface QueryPreviewTableProps {
  results: GeneratedQueries[];
}

export default function QueryPreviewTable({ results }: QueryPreviewTableProps) {
  if (!results || results.length === 0) return null;

  const maxLines = Math.max(...results.map((r) => r.lines.length));

  return (
    <div className="w-full border border-hairline rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th
                className="sticky top-0 z-10 bg-surface-card px-4 py-3 text-left font-semibold text-ink border-b border-hairline whitespace-nowrap min-w-[60px]"
                scope="col"
              >
                #
              </th>
              <th
                className="sticky top-0 z-10 bg-surface-card px-4 py-3 text-left font-semibold text-ink border-b border-hairline whitespace-nowrap min-w-[100px]"
                scope="col"
              >
                Concept
              </th>
              {results.map((r) => (
                <th
                  key={r.database}
                  className="sticky top-0 z-10 bg-surface-card px-4 py-3 text-left font-semibold text-ink border-b border-hairline whitespace-nowrap"
                  scope="col"
                >
                  {r.database}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxLines }).map((_, lineIdx) => {
              const firstLine = results[0]?.lines[lineIdx];
              const isLastRow = lineIdx === maxLines - 1;
              return (
                <tr
                  key={lineIdx}
                  className={`transition-colors hover:bg-surface-soft ${
                    isLastRow ? "bg-surface-card" : ""
                  }`}
                >
                  <td
                    className={`px-4 py-2.5 border-b border-hairline font-mono text-xs whitespace-nowrap ${
                      isLastRow ? "font-bold" : "text-muted"
                    }`}
                  >
                    {firstLine ? `#${firstLine.step}` : ""}
                  </td>
                  <td
                    className={`px-4 py-2.5 border-b border-hairline ${
                      isLastRow ? "font-bold" : ""
                    }`}
                  >
                    {firstLine?.concept || ""}
                  </td>
                  {results.map((r) => (
                    <td
                      key={r.database}
                      className={`px-4 py-2.5 border-b border-hairline font-mono text-xs text-ink-strong ${
                        isLastRow ? "font-bold" : ""
                      }`}
                    >
                      {r.lines[lineIdx]?.query || ""}
                    </td>
                  ))}
                </tr>
              );
            })}

            {/* Final combined row */}
            <tr className="bg-surface-card">
              <td className="px-4 py-3 border-b border-hairline font-mono text-xs font-bold">
                Final
              </td>
              <td className="px-4 py-3 border-b border-hairline font-bold">
                AND
              </td>
              {results.map((r) => (
                <td key={r.database} className="px-4 py-3 border-b border-hairline font-mono text-xs font-bold text-ink">
                  {r.final}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
