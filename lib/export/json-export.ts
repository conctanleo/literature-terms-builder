import { GeneratedQueries } from "@/lib/query-builder/generator";

export function generateJSON(
  results: GeneratedQueries[],
  concepts?: unknown
): object {
  return {
    generatedAt: new Date().toISOString(),
    databases: results.map((r) => r.database),
    queries: results,
    concepts: concepts || null,
  };
}
