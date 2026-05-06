import { DatabaseConfig } from "@/lib/db-config/types";

export interface ValidationError {
  line: number;
  message: string;
}

export function validateQuery(queryText: string, config: DatabaseConfig): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = queryText.split("\n").filter((l) => l.trim());

  lines.forEach((line, i) => {
    // Check parentheses pairing
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push({ line: i + 1, message: "Mismatched parentheses" });
    }

    // Check truncation usage for databases that don't support it
    if (config.truncation.right === null && line.includes("*")) {
      errors.push({ line: i + 1, message: `Truncation (*) is not supported in ${config.name}` });
    }

    // Check proximity syntax for databases that don't support it
    if (!config.proximity) {
      const hasProximity = /\b(NEAR|ADJ)\b/i.test(line) || /\b(PRE|W)\/\d+/i.test(line);
      if (hasProximity) {
        errors.push({ line: i + 1, message: `Proximity operators are not supported in ${config.name}` });
      }
    }
  });

  return errors;
}
