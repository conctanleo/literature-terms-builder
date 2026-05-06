import { DatabaseConfig } from "./types";

const pubmed: DatabaseConfig = {
  id: "pubmed", name: "PubMed", language: "en",
  operators: { and: "AND", or: "OR", not: "NOT" },
  fieldQualifier: "[]",
  quoting: { exact: ['"', '"'], loose: ['"', '"'] },
  truncation: { right: "*", internal: null, left: null },
  wildcards: { single: null, multi: null },
  proximity: null,
  lineNumberFormat: "#{n}",
  supportsNesting: true,
  defaultFields: ["tiab"],
  defaultSearchMode: "advanced",
  fields: [
    { key: "ti", label: "Title", syntax: "[ti]" },
    { key: "ab", label: "Abstract", syntax: "[ab]" },
    { key: "tiab", label: "Title/Abstract", syntax: "[tiab]" },
    { key: "mh", label: "MeSH Terms", syntax: "[mh]" },
    { key: "mh_noexp", label: "MeSH (no explode)", syntax: "[mh:noexp]" },
    { key: "majr", label: "MeSH Major Topic", syntax: "[majr]" },
    { key: "tw", label: "Text Words", syntax: "[tw]" },
    { key: "all", label: "All Fields", syntax: "[all]" },
    { key: "au", label: "Author", syntax: "[au]" },
    { key: "dp", label: "Date Published", syntax: "[dp]" },
  ],
  exportNotes: "PubMed does not support proximity searching (NEAR/ADJ). Use phrase searching or AND combinations.",
};

const wos: DatabaseConfig = {
  id: "wos", name: "Web of Science", language: "en",
  operators: { and: "AND", or: "OR", not: "NOT" },
  fieldQualifier: "=",
  quoting: { exact: ['"', '"'], loose: ['"', '"'] },
  truncation: { right: "*", internal: null, left: null },
  wildcards: { single: "?", multi: "$" },
  proximity: { syntax: "NEAR/{n}", maxDistance: 255 },
  lineNumberFormat: "#{n}",
  supportsNesting: true,
  defaultFields: ["ts"],
  defaultSearchMode: "advanced",
  fields: [
    { key: "ts", label: "Topic", syntax: "TS=" },
    { key: "ti", label: "Title", syntax: "TI=" },
    { key: "ab", label: "Abstract", syntax: "AB=" },
    { key: "ak", label: "Author Keywords", syntax: "AK=" },
    { key: "kp", label: "Keywords Plus", syntax: "KP=" },
    { key: "au", label: "Author", syntax: "AU=" },
    { key: "so", label: "Source", syntax: "SO=" },
    { key: "py", label: "Year Published", syntax: "PY=" },
  ],
};

const scopus: DatabaseConfig = {
  id: "scopus", name: "Scopus", language: "en",
  operators: { and: "AND", or: "OR", not: "AND NOT" },
  fieldQualifier: "()",
  quoting: { exact: ["{", "}"], loose: ['"', '"'] },
  truncation: { right: "*", internal: null, left: null },
  wildcards: { single: "?", multi: null },
  proximity: { syntax: "W/{n}", maxDistance: 255, ordered: "PRE/{n}" },
  lineNumberFormat: "#{n}",
  supportsNesting: true,
  defaultFields: ["title_abs_key"],
  defaultSearchMode: "advanced",
  fields: [
    { key: "title", label: "Title", syntax: "TITLE" },
    { key: "abs", label: "Abstract", syntax: "ABS" },
    { key: "key", label: "Keywords", syntax: "KEY" },
    { key: "title_abs_key", label: "Title/Abstract/Keywords", syntax: "TITLE-ABS-KEY" },
    { key: "all", label: "All Fields", syntax: "ALL" },
    { key: "auth", label: "Author", syntax: "AUTH" },
    { key: "src", label: "Source Title", syntax: "SRCTITLE" },
  ],
};

const embase: DatabaseConfig = {
  id: "embase", name: "Embase", language: "en",
  operators: { and: "AND", or: "OR", not: "NOT" },
  fieldQualifier: ":",
  quoting: { exact: ["'", "'"], loose: ['"', '"'] },
  truncation: { right: "*", internal: null, left: null },
  wildcards: { single: "?", multi: "$" },
  proximity: { syntax: "NEAR/{n}", maxDistance: 255, ordered: "NEXT/{n}" },
  lineNumberFormat: "#{n}",
  supportsNesting: true,
  defaultFields: ["ti_ab_kw"],
  defaultSearchMode: "advanced",
  fields: [
    { key: "ti", label: "Title", syntax: ":ti" },
    { key: "ab", label: "Abstract", syntax: ":ab" },
    { key: "ti_ab_kw", label: "Title/Abstract/Keywords", syntax: ":ti,ab,kw" },
    { key: "de", label: "Index Terms", syntax: ":de" },
    { key: "au", label: "Author", syntax: ":au" },
    { key: "dm", label: "Device/Manufacturer", syntax: ":dm" },
    { key: "it", label: "Item Type", syntax: ":it" },
  ],
};

const ovidMedline: DatabaseConfig = {
  id: "ovid_medline", name: "Ovid MEDLINE", language: "en",
  operators: { and: "AND", or: "OR", not: "NOT" },
  fieldQualifier: ".",
  quoting: { exact: ['"', '"'], loose: ['"', '"'] },
  truncation: { right: "*", internal: null, left: null },
  wildcards: { single: "#", multi: "?" },
  proximity: { syntax: "ADJ{n}", maxDistance: 99 },
  lineNumberFormat: "{n}",
  supportsNesting: true,
  defaultFields: ["mp"],
  defaultSearchMode: "advanced",
  fields: [
    { key: "ti", label: "Title", syntax: ".ti." },
    { key: "ab", label: "Abstract", syntax: ".ab." },
    { key: "tw", label: "Text Words", syntax: ".tw." },
    { key: "mp", label: "Multi-Purpose", syntax: ".mp." },
    { key: "kf", label: "Keyword Heading", syntax: ".kf." },
    { key: "kw", label: "Keyword", syntax: ".kw." },
    { key: "pt", label: "Publication Type", syntax: ".pt." },
  ],
  exportNotes: "Turn off Mapping for truncation to work. Use exp before term to explode. Use * before term to focus as major topic.",
};

const cnki: DatabaseConfig = {
  id: "cnki", name: "CNKI", nameZh: "中国知网", language: "zh",
  operators: { and: "*", or: "+", not: "-" },
  fieldQualifier: "=",
  quoting: { exact: ["'", "'"], loose: ["'", "'"] },
  truncation: { right: "*", internal: "?", left: null },
  wildcards: { single: "?", multi: "*" },
  proximity: null,
  lineNumberFormat: "#{n}",
  supportsNesting: true,
  defaultFields: ["su"],
  defaultSearchMode: "advanced",
  fields: [
    { key: "su", label: "主题", syntax: "SU=" },
    { key: "ti", label: "题名", syntax: "TI=" },
    { key: "ky", label: "关键词", syntax: "KY=" },
    { key: "ab", label: "摘要", syntax: "AB=" },
    { key: "ft", label: "全文", syntax: "FT=" },
    { key: "au", label: "作者", syntax: "AU=" },
    { key: "jn", label: "文献来源", syntax: "JN=" },
  ],
  exportNotes: "Use * for AND, + for OR, - for NOT in professional search. = for exact match, % for fuzzy match.",
};

const wanfang: DatabaseConfig = {
  id: "wanfang", name: "Wanfang", nameZh: "万方数据", language: "zh",
  operators: { and: "AND", or: "OR", not: "NOT" },
  fieldQualifier: ":",
  quoting: { exact: ['"', '"'], loose: ["", ""] },
  truncation: { right: "*", internal: null, left: null },
  wildcards: { single: "?", multi: "*" },
  proximity: null,
  lineNumberFormat: "#{n}",
  supportsNesting: true,
  defaultFields: ["theme"],
  defaultSearchMode: "basic",
  fields: [
    { key: "theme", label: "主题", syntax: "主题:" },
    { key: "title", label: "题名", syntax: "题名:" },
    { key: "keyword", label: "关键词", syntax: "关键词:" },
    { key: "abstract", label: "摘要", syntax: "摘要:" },
    { key: "author", label: "作者", syntax: "作者:" },
    { key: "journal", label: "刊名", syntax: "刊名:" },
  ],
};

const weipu: DatabaseConfig = {
  id: "weipu", name: "VIP", nameZh: "维普中文期刊", language: "zh",
  operators: { and: "AND", or: "OR", not: "NOT" },
  fieldQualifier: "=",
  quoting: { exact: ['"', '"'], loose: ["", ""] },
  truncation: { right: null, internal: null, left: null },
  wildcards: { single: null, multi: null },
  proximity: null,
  lineNumberFormat: "#{n}",
  supportsNesting: true,
  defaultFields: ["m"],
  defaultSearchMode: "basic",
  fields: [
    { key: "m", label: "题名或关键词", syntax: "M=" },
    { key: "k", label: "关键词", syntax: "K=" },
    { key: "t", label: "题名", syntax: "T=" },
    { key: "r", label: "文摘", syntax: "R=" },
    { key: "a", label: "作者", syntax: "A=" },
    { key: "j", label: "刊名", syntax: "J=" },
    { key: "u", label: "任意字段", syntax: "U=" },
  ],
  exportNotes: "* may be used as AND, + as OR in compound searches.",
};

const sinomed: DatabaseConfig = {
  id: "sinomed", name: "Sinomed", nameZh: "中国生物医学文献数据库", language: "zh",
  operators: { and: "AND", or: "OR", not: "NOT" },
  fieldQualifier: "[]",
  quoting: { exact: ['"', '"'], loose: ['"', '"'] },
  truncation: { right: null, internal: null, left: null },
  wildcards: { single: "?", multi: "%" },
  proximity: null,
  lineNumberFormat: "#{n}",
  supportsNesting: true,
  defaultFields: ["common"],
  defaultSearchMode: "advanced",
  fields: [
    { key: "common", label: "常用字段", syntax: "[常用字段]" },
    { key: "title", label: "标题", syntax: "[标题]" },
    { key: "abstract", label: "摘要", syntax: "[摘要]" },
    { key: "keywords", label: "关键词", syntax: "[关键词]" },
    { key: "author", label: "作者", syntax: "[作者]" },
    { key: "mesh", label: "主题词", syntax: "[主题词]" },
    { key: "all", label: "全部字段", syntax: "[全部字段]" },
  ],
  exportNotes: "Uses MeSH Chinese translation for subject searching. % replaces any chars, ? replaces one char.",
};

export const databaseRegistry: Record<string, DatabaseConfig> = {
  pubmed, wos, scopus, embase, ovid_medline: ovidMedline,
  cnki, wanfang, weipu, sinomed,
};

export function getDatabaseConfig(id: string): DatabaseConfig | undefined {
  return databaseRegistry[id];
}

export function getAllDatabases(): DatabaseConfig[] {
  return Object.values(databaseRegistry);
}
