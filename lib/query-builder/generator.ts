import { DatabaseConfig } from "@/lib/db-config/types";
import { buildConceptLine, buildFinalLine } from "./formatter";

export interface ConceptGroup {
  name: string;
  keywords: string[];
  synonyms: { keyword: string; synonyms: string[] }[];
}

export interface QueryLine {
  step: number;
  concept: string;
  query: string;
  fieldUsed: string;
}

export interface GeneratedQueries {
  database: string;
  lines: QueryLine[];
  final: string;
  totalSteps: number;
}

/** Generate search queries for one database */
export function generateQueries(
  concepts: ConceptGroup[],
  config: DatabaseConfig
): GeneratedQueries {
  const fieldKey = config.defaultFields[0];
  const field = config.fields.find((f) => f.key === fieldKey);
  const fieldLabel = field?.label || fieldKey;

  const lines: QueryLine[] = concepts.map((concept, i) => {
    // Flatten keywords + synonyms into a deduplicated set
    const allTerms = new Set<string>();
    concept.keywords.forEach((kw) => {
      allTerms.add(kw);
      const synEntry = concept.synonyms.find((s) => s.keyword === kw);
      if (synEntry) {
        synEntry.synonyms.forEach((s) => allTerms.add(s));
      }
    });

    const termList = Array.from(allTerms);
    const query = buildConceptLine(termList, fieldKey, config);

    return {
      step: i + 1,
      concept: concept.name,
      query,
      fieldUsed: fieldLabel,
    };
  });

  const final = buildFinalLine(
    lines.map((l) => l.step),
    config
  );

  return {
    database: config.id,
    lines,
    final,
    totalSteps: lines.length + 1,
  };
}

/** Generate queries for multiple databases */
export function generateForMultipleDatabases(
  concepts: ConceptGroup[],
  configs: DatabaseConfig[]
): GeneratedQueries[] {
  return configs.map((config) => generateQueries(concepts, config));
}
