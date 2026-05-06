export interface OperatorConfig {
  and: string;
  or: string;
  not: string;
}

export interface FieldDef {
  key: string;
  label: string;
  syntax: string;
  description?: string;
}

export interface QuotingConfig {
  exact: [string, string];
  loose: [string, string];
}

export interface TruncationConfig {
  right: string | null;
  internal: string | null;
  left: string | null;
}

export interface ProximityConfig {
  syntax: string;
  maxDistance: number;
  ordered?: string;
}

export interface DatabaseConfig {
  id: string;
  name: string;
  nameZh?: string;
  language: "en" | "zh";
  operators: OperatorConfig;
  fields: FieldDef[];
  defaultFields: string[];
  quoting: QuotingConfig;
  truncation: TruncationConfig;
  wildcards: { single: string | null; multi: string | null };
  proximity: ProximityConfig | null;
  lineNumberFormat: string;
  supportsNesting: boolean;
  fieldQualifier: string;
  defaultSearchMode: "advanced" | "mesh" | "basic";
  exportNotes?: string;
}
