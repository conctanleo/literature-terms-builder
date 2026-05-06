import { GeneratedQueries } from "@/lib/query-builder/generator";

export function generateCSV(results: GeneratedQueries[]): string {
  const headers = ["Step", "Concept", ...results.map((r) => r.database)];
  const rows: string[][] = [];

  // Header
  rows.push(headers);

  // Data rows
  const maxLines = Math.max(...results.map((r) => r.lines.length));
  for (let i = 0; i < maxLines; i++) {
    const row: string[] = [];
    const firstLine = results[0]?.lines[i];
    row.push(firstLine ? `#${firstLine.step}` : "");
    row.push(firstLine?.concept || "");
    results.forEach((r) => {
      row.push(r.lines[i]?.query || "");
    });
    rows.push(row);
  }

  // Final row
  const finalRow: string[] = ["Final", "AND"];
  results.forEach((r) => finalRow.push(r.final));
  rows.push(finalRow);

  return rows
    .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
    .join("\n");
}
