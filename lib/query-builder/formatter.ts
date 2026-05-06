import { DatabaseConfig } from "@/lib/db-config/types";

/** Wrap multi-word terms in the database's phrase quotes */
export function formatTerm(term: string, config: DatabaseConfig): string {
  const hasSpace = term.includes(" ");
  if (hasSpace) {
    const [open, close] = config.quoting.exact;
    return `${open}${term}${close}`;
  }
  return term;
}

/** Apply right-truncation to a term */
export function applyTruncation(term: string, config: DatabaseConfig): string {
  if (config.truncation.right) {
    return term + config.truncation.right;
  }
  return term;
}

/** Format a term with the correct field qualifier syntax for the database */
export function formatFieldQualifier(term: string, fieldKey: string, config: DatabaseConfig): string {
  const field = config.fields.find((f) => f.key === fieldKey);
  if (!field) return term;

  switch (config.fieldQualifier) {
    case "[]":
      return `${term}${field.syntax}`;
    case "=":
      return `${field.syntax}${term}`;
    case "()":
      return `${field.syntax}(${term})`;
    case ":":
      return `${term}${field.syntax}`;
    case ".":
      return `${term}${field.syntax}`;
    default:
      return term;
  }
}

/** Build a single concept line: all terms OR-joined with field qualifiers */
export function buildConceptLine(
  terms: string[],
  fieldKey: string,
  config: DatabaseConfig
): string {
  const formatted = terms.map((t) => {
    const quoted = formatTerm(t, config);
    return formatFieldQualifier(quoted, fieldKey, config);
  });
  return formatted.join(` ${config.operators.or} `);
}

/** Build the final combined line using line numbers */
export function buildFinalLine(
  lineNumbers: number[],
  config: DatabaseConfig
): string {
  return lineNumbers
    .map((n) => config.lineNumberFormat.replace("{n}", String(n)))
    .join(` ${config.operators.and} `);
}
