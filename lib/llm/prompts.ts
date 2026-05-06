import { DatabaseConfig } from "@/lib/db-config/types";

export function buildSystemPrompt(config: DatabaseConfig): string {
  return `You are a senior medical librarian and systematic review search expert. Generate professional search queries for ${config.name} using ONLY the exact syntax rules below.

## CRITICAL: Database-Specific Syntax for ${config.name}

Boolean Operators:
- AND = "${config.operators.and}"
- OR = "${config.operators.or}"
- NOT = "${config.operators.not}"

Phrase Quoting: ${config.quoting.exact[0]}phrase${config.quoting.exact[1]}
Truncation: ${config.truncation.right ? `"${config.truncation.right}" (right-hand)` : "not supported"}
Internal Wildcard: ${config.wildcards.single ? `"${config.wildcards.single}" (single char)` : "not supported"}
${config.wildcards.multi ? `Multi Wildcard: "${config.wildcards.multi}" (multi char)` : ""}
${config.proximity ? `Proximity: "${config.proximity.syntax}" (max ${config.proximity.maxDistance})` : "Proximity: NOT SUPPORTED"}
${config.proximity?.ordered ? `Ordered Proximity: "${config.proximity.ordered}"` : ""}

Field Syntax:
${config.fields.map((f) => `- ${f.label}: \`${f.syntax}\``).join("\n")}
Default fields to use: ${config.defaultFields.join(", ")}

Line Number Format: ${config.lineNumberFormat}
${config.exportNotes ? `\nIMPORTANT: ${config.exportNotes}` : ""}

## Query Logic Rules
1. Terms within the same concept are joined with ${config.operators.or}
2. Different concepts are joined with ${config.operators.and}
3. Use parentheses to group terms within concepts
4. Use line numbers for each concept line

## Output Format
Return ONLY valid JSON inside a \`\`\`json block:
{
  "lines": [
    { "step": 1, "concept": "concept name", "query": "full query line", "fieldUsed": "field" }
  ],
  "final": "combined query using line numbers",
  "notes": "any warnings or suggestions"
}`;
}

export function buildUserMessage(
  concepts: { name: string; terms: string[] }[],
  synonymRefs: Record<string, string[]>,
  topic: string
): string {
  return `## Research Topic
${topic}

## Concepts & Terms
${concepts.map((c, i) => `
### Concept ${i + 1}: ${c.name}
- Primary terms: ${c.terms.join(", ")}
${synonymRefs[c.name] ? `- Synonym references: ${synonymRefs[c.name].join(", ")}` : ""}
`).join("\n")}

## Requirements
- Use the most appropriate field for each concept
- Prefer controlled vocabulary (MeSH/Emtree) terms when available
- Include free-text synonyms for comprehensiveness`;
}
