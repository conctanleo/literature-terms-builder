# Search Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web app for generating multi-database academic search queries with synonym matching and LLM assistance.

**Architecture:** Next.js 14 App Router full-stack app. `lib/` holds pure TypeScript logic (db-config, synonyms, query-builder, llm, export). `app/api/` routes proxy synonym lookups, query generation, and file export. `components/` renders the 5-step builder UI styled per design.md.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS (custom tokens from design.md), exceljs, papaparse

---

## File Map

```
terms/                              # Project root (Next.js app)
├── package.json
├── tsconfig.json
├── tailwind.config.ts              # Custom tokens (canvas, coral, etc.)
├── next.config.js
├── app/
│   ├── layout.tsx                  # Root layout (topnav + footer)
│   ├── globals.css                 # Tailwind directives + design tokens
│   ├── page.tsx                    # Home page (hero + project entry)
│   ├── builder/
│   │   └── page.tsx                # 5-step builder (client component)
│   ├── settings/
│   │   └── page.tsx                # Database config editor
│   └── api/
│       ├── synonyms/
│       │   ├── lookup/route.ts     # GET ?db=X&term=Y → synonym results
│       │   └── pubmed/route.ts     # GET ?term=X → MeSH lookup proxy
│       ├── generate/
│       │   ├── code/route.ts       # POST → Mode 1 query generation
│       │   └── llm/route.ts        # POST → Mode 2 LLM generation
│       └── export/
│           └── [format]/route.ts   # GET ?format=xlsx|csv|json
├── lib/
│   ├── db-config/
│   │   ├── types.ts                # DatabaseConfig interface
│   │   ├── registry.ts             # 9 built-in database configs
│   │   └── storage.ts              # LocalStorage wrapper for custom DBs
│   ├── synonyms/
│   │   ├── engine.ts               # Match engine (cache → builtin → API → fuzzy)
│   │   ├── cache.ts                # In-memory + localStorage cache
│   │   ├── fetchers/
│   │   │   └── pubmed.ts           # NCBI E-utilities API client
│   │   └── builtin/
│   │       ├── mesh-en.ts          # Curated English MeSH subset (JSON)
│   │       └── sinomed-zh.ts       # Curated Chinese Sinomed subset (JSON)
│   ├── query-builder/
│   │   ├── generator.ts            # Concept groups → QueryLine[]
│   │   └── formatter.ts            # Apply db config syntax to terms
│   ├── llm/
│   │   ├── client.ts               # GLM-5 Anthropic-protocol client
│   │   └── prompts.ts              # System + user prompt templates
│   └── export/
│       ├── excel.ts                # exceljs workbook builder
│       ├── csv.ts                  # papaparse CSV stringifier
│       └── json.ts                 # Structured JSON serializer
├── components/
│   ├── TopNav.tsx                  # Sticky nav
│   ├── Footer.tsx                  # Dark footer
│   ├── StepIndicator.tsx           # 5-step progress bar
│   ├── ConceptEditor.tsx           # Concept group + keyword input
│   ├── SynonymReview.tsx           # Synonym match result table (editable)
│   ├── DatabaseSelector.tsx        # Database chip grid
│   ├── ModeToggle.tsx              # Mode 1 / Mode 2 switch
│   ├── QueryPreviewTable.tsx       # Multi-column query comparison table
│   ├── CodeWindow.tsx              # Dark code block with copy & line numbers
│   └── ExportPanel.tsx             # 3-format export buttons
└── data/
    └── builtin-thesauri/
        ├── mesh-en.json            # MeSH subset (~200 core medical terms)
        └── sinomed-zh.json         # Sinomed subset (~200 core Chinese terms)
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `terms/package.json`
- Create: `terms/tsconfig.json`
- Create: `terms/tailwind.config.ts`
- Create: `terms/next.config.js`
- Create: `terms/app/globals.css`
- Create: `terms/app/layout.tsx`
- Create: `terms/.env.local`

- [ ] **Step 1: Initialize Next.js project**

Run:
```bash
cd D:/terms && npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm --no-turbopack
```
Expected: Scaffolded Next.js 14 project in `D:/terms`.

- [ ] **Step 2: Install additional dependencies**

Run:
```bash
cd D:/terms && npm install exceljs papaparse @types/papaparse
```
Expected: Dependencies added.

- [ ] **Step 3: Configure Tailwind with design.md tokens**

Write `tailwind.config.ts`:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#cc785c", active: "#a9583e", disabled: "#e6dfd8", ring: "rgba(204,120,92,0.20)" },
        ink: { DEFAULT: "#141413", body: "#3d3d3a", strong: "#252523" },
        muted: { DEFAULT: "#6c6a64", soft: "#8e8b82" },
        hairline: { DEFAULT: "#e6dfd8", soft: "#ebe6df" },
        canvas: { DEFAULT: "#faf9f5" },
        surface: { soft: "#f5f0e8", card: "#efe9de", "cream-strong": "#e8e0d2", dark: "#181715", "dark-elevated": "#252320", "dark-soft": "#1f1e1b" },
        "on-dark": { DEFAULT: "#faf9f5", soft: "#a09d96" },
        accent: { teal: "#5db8a6", amber: "#e8a55a" },
        semantic: { success: "#5db872", warning: "#d4a017", error: "#c64545" },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', '"Tiempos Headline"', '"EB Garamond"', "Garamond", "Georgia", "serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", "sans-serif"],
        mono: ['"JetBrains Mono"', '"Cascadia Code"', "ui-monospace", "monospace"],
      },
      borderRadius: { xs: "4px", sm: "6px", md: "8px", lg: "12px", xl: "16px", pill: "9999px" },
      spacing: { section: "96px" },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 4: Write globals.css with design tokens**

Write `app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

@layer base {
  body {
    @apply bg-canvas text-ink-body font-sans text-sm leading-relaxed antialiased;
  }
  :focus-visible {
    @apply outline-2 outline-offset-2 outline-primary;
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
}

@layer components {
  .btn-primary {
    @apply inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 min-h-[40px]
           font-sans text-sm font-medium leading-none
           bg-primary text-white
           transition-all duration-[180ms] ease-out
           active:scale-[0.97] hover:bg-primary-active
           focus-visible:ring-[3px] focus-visible:ring-primary-ring
           disabled:bg-primary-disabled disabled:text-muted disabled:cursor-not-allowed disabled:transform-none;
  }
  .btn-secondary {
    @apply inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 min-h-[40px]
           font-sans text-sm font-medium leading-none
           bg-canvas text-ink border border-hairline
           transition-all duration-[180ms] ease-out
           active:scale-[0.97] hover:bg-surface-soft
           disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none;
  }
  .btn-sm {
    @apply text-xs px-3.5 py-1.5 min-h-[28px] rounded-sm;
  }
  .card {
    @apply bg-canvas border border-hairline rounded-lg p-8 mb-6;
  }
  .card-cream {
    @apply bg-surface-card rounded-lg p-8 mb-6;
  }
  .card-dark {
    @apply bg-surface-dark rounded-lg p-8 mb-6 overflow-hidden;
  }
  .section-title {
    @apply font-display text-[28px] font-semibold leading-tight -tracking-[0.3px] text-ink mb-2;
  }
  .section-sub {
    @apply text-base text-muted mb-8;
  }
  .text-input {
    @apply bg-canvas border border-hairline rounded-md px-3.5 py-2.5 h-10
           font-sans text-sm text-ink
           focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary-ring
           placeholder:text-muted-soft;
  }
}
```

- [ ] **Step 5: Write root layout with TopNav and Footer**

Write `app/layout.tsx`:
```tsx
import "./globals.css";
import type { Metadata } from "next";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "SearchBuilder — 多数据库检索式生成器",
  description: "输入关键词，自动匹配同义词，一键生成多数据库专业检索式",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col">
        <TopNav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Set .env.local**

Write `.env.local`:
```
GLM5_API_KEY=78bb6679f5af44df874b9c4ee67cd934.jixinLArSlyhjaDY
GLM5_BASE_URL=https://api.z.ai/api/anthropic
```

- [ ] **Step 7: Verify dev server starts**

Run:
```bash
cd D:/terms && npm run dev
```
Expected: Server starts on localhost:3000, page renders with nav + footer.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: scaffold Next.js project with Tailwind design tokens"
```

---

### Task 2: Database Config Registry

**Files:**
- Create: `lib/db-config/types.ts`
- Create: `lib/db-config/registry.ts`
- Create: `lib/db-config/storage.ts`

- [ ] **Step 1: Write DatabaseConfig types**

Write `lib/db-config/types.ts`:
```typescript
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
  lineNumberFormat: string;    // e.g. "#{n}" or "{n}"
  supportsNesting: boolean;
  fieldQualifier: string;       // e.g. ":" or "=" or "[...]"
  defaultSearchMode: "advanced" | "mesh" | "basic";
  exportNotes?: string;
}
```

- [ ] **Step 2: Write 9 database configs in registry.ts**

Write `lib/db-config/registry.ts`:
```typescript
import { DatabaseConfig } from "./types";

export const pubmedConfig: DatabaseConfig = {
  id: "pubmed",
  name: "PubMed",
  language: "en",
  operators: { and: "AND", or: "OR", not: "NOT" },
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
  defaultFields: ["tiab"],
  quoting: { exact: ['"', '"'], loose: ['"', '"'] },
  truncation: { right: "*", internal: null, left: null },
  wildcards: { single: null, multi: null },
  proximity: null,
  lineNumberFormat: "#{n}",
  supportsNesting: true,
  fieldQualifier: "[]",
  defaultSearchMode: "advanced",
  exportNotes: "PubMed does not support proximity searching (NEAR/ADJ). Use phrase searching or AND combinations instead.",
};

export const wosConfig: DatabaseConfig = {
  id: "wos",
  name: "Web of Science",
  language: "en",
  operators: { and: "AND", or: "OR", not: "NOT" },
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
  defaultFields: ["ts"],
  quoting: { exact: ['"', '"'], loose: ['"', '"'] },
  truncation: { right: "*", internal: null, left: null },
  wildcards: { single: "?", multi: "$" },
  proximity: { syntax: "NEAR/{n}", maxDistance: 255 },
  lineNumberFormat: "#{n}",
  supportsNesting: true,
  fieldQualifier: "=",
  defaultSearchMode: "advanced",
};

export const scopusConfig: DatabaseConfig = {
  id: "scopus",
  name: "Scopus",
  language: "en",
  operators: { and: "AND", or: "OR", not: "AND NOT" },
  fields: [
    { key: "title", label: "Title", syntax: "TITLE" },
    { key: "abs", label: "Abstract", syntax: "ABS" },
    { key: "key", label: "Keywords", syntax: "KEY" },
    { key: "title_abs_key", label: "Title/Abstract/Keywords", syntax: "TITLE-ABS-KEY" },
    { key: "all", label: "All Fields", syntax: "ALL" },
    { key: "auth", label: "Author", syntax: "AUTH" },
    { key: "src", label: "Source Title", syntax: "SRCTITLE" },
  ],
  defaultFields: ["title_abs_key"],
  quoting: { exact: ["{", "}"], loose: ['"', '"'] },
  truncation: { right: "*", internal: null, left: null },
  wildcards: { single: "?", multi: null },
  proximity: { syntax: "W/{n}", maxDistance: 255, ordered: "PRE/{n}" },
  lineNumberFormat: "#{n}",
  supportsNesting: true,
  fieldQualifier: "()",
  defaultSearchMode: "advanced",
};

export const embaseConfig: DatabaseConfig = {
  id: "embase",
  name: "Embase",
  language: "en",
  operators: { and: "AND", or: "OR", not: "NOT" },
  fields: [
    { key: "ti", label: "Title", syntax: ":ti" },
    { key: "ab", label: "Abstract", syntax: ":ab" },
    { key: "ti_ab_kw", label: "Title/Abstract/Keywords", syntax: ":ti,ab,kw" },
    { key: "de", label: "Index Terms", syntax: ":de" },
    { key: "au", label: "Author", syntax: ":au" },
    { key: "dm", label: "Device", syntax: ":dm" },
    { key: "it", label: "Drug Trade Name", syntax: ":it" },
  ],
  defaultFields: ["ti_ab_kw"],
  quoting: { exact: ["'", "'"], loose: ['"', '"'] },
  truncation: { right: "*", internal: null, left: null },
  wildcards: { single: "?", multi: "$" },
  proximity: { syntax: "NEAR/{n}", maxDistance: 255, ordered: "NEXT/{n}" },
  lineNumberFormat: "#{n}",
  supportsNesting: true,
  fieldQualifier: ":",
  defaultSearchMode: "advanced",
};

export const ovidMedlineConfig: DatabaseConfig = {
  id: "ovid_medline",
  name: "Ovid MEDLINE",
  language: "en",
  operators: { and: "AND", or: "OR", not: "NOT" },
  fields: [
    { key: "ti", label: "Title", syntax: ".ti." },
    { key: "ab", label: "Abstract", syntax: ".ab." },
    { key: "tw", label: "Text Words", syntax: ".tw." },
    { key: "mp", label: "Multi-Purpose", syntax: ".mp." },
    { key: "kf", label: "Keyword Heading", syntax: ".kf." },
    { key: "kw", label: "Keyword", syntax: ".kw." },
    { key: "pt", label: "Publication Type", syntax: ".pt." },
  ],
  defaultFields: ["mp"],
  quoting: { exact: ['"', '"'], loose: ['"', '"'] },
  truncation: { right: "*", internal: null, left: null },
  wildcards: { single: "#", multi: "?" },
  proximity: { syntax: "ADJ{n}", maxDistance: 99 },
  lineNumberFormat: "{n}",
  supportsNesting: true,
  fieldQualifier: ".",
  defaultSearchMode: "advanced",
  exportNotes: "Turn off Mapping for truncation to work. Use exp before term to explode. Use * before term to focus as major topic.",
};

export const cnkiConfig: DatabaseConfig = {
  id: "cnki",
  name: "CNKI",
  nameZh: "中国知网",
  language: "zh",
  operators: { and: "*", or: "+", not: "-" },
  fields: [
    { key: "su", label: "主题", syntax: "SU" },
    { key: "ti", label: "题名", syntax: "TI" },
    { key: "ky", label: "关键词", syntax: "KY" },
    { key: "ab", label: "摘要", syntax: "AB" },
    { key: "ft", label: "全文", syntax: "FT" },
    { key: "au", label: "作者", syntax: "AU" },
    { key: "jn", label: "文献来源", syntax: "JN" },
  ],
  defaultFields: ["su"],
  quoting: { exact: ["'", "'"], loose: ["'", "'"] },
  truncation: { right: "*", internal: "?", left: null },
  wildcards: { single: "?", multi: "*" },
  proximity: null,
  lineNumberFormat: "#{n}",
  supportsNesting: true,
  fieldQualifier: "=",
  defaultSearchMode: "advanced",
  exportNotes: "Use * for AND, + for OR, - for NOT in professional search. = for exact match, % for fuzzy match.",
};

export const wanfangConfig: DatabaseConfig = {
  id: "wanfang",
  name: "Wanfang",
  nameZh: "万方数据",
  language: "zh",
  operators: { and: "AND", or: "OR", not: "NOT" },
  fields: [
    { key: "theme", label: "主题", syntax: "主题:" },
    { key: "title", label: "题名", syntax: "题名:" },
    { key: "keyword", label: "关键词", syntax: "关键词:" },
    { key: "abstract", label: "摘要", syntax: "摘要:" },
    { key: "author", label: "作者", syntax: "作者:" },
    { key: "journal", label: "刊名", syntax: "刊名:" },
  ],
  defaultFields: ["theme"],
  quoting: { exact: ['"', '"'], loose: ["", ""] },
  truncation: { right: "*", internal: null, left: null },
  wildcards: { single: "?", multi: "*" },
  proximity: null,
  lineNumberFormat: "#{n}",
  supportsNesting: true,
  fieldQualifier: ":",
  defaultSearchMode: "basic",
};

export const weipuConfig: DatabaseConfig = {
  id: "weipu",
  name: "VIP",
  nameZh: "维普中文期刊",
  language: "zh",
  operators: { and: "AND", or: "OR", not: "NOT" },
  fields: [
    { key: "m", label: "题名或关键词", syntax: "M=" },
    { key: "k", label: "关键词", syntax: "K=" },
    { key: "t", label: "题名", syntax: "T=" },
    { key: "r", label: "文摘", syntax: "R=" },
    { key: "a", label: "作者", syntax: "A=" },
    { key: "j", label: "刊名", syntax: "J=" },
    { key: "u", label: "任意字段", syntax: "U=" },
  ],
  defaultFields: ["m"],
  quoting: { exact: ['"', '"'], loose: ["", ""] },
  truncation: { right: null, internal: null, left: null },
  wildcards: { single: null, multi: null },
  proximity: null,
  lineNumberFormat: "#{n}",
  supportsNesting: true,
  fieldQualifier: "=",
  defaultSearchMode: "basic",
  exportNotes: "Star (*) may be used as AND operator, plus (+) as OR in compound searches.",
};

export const sinomedConfig: DatabaseConfig = {
  id: "sinomed",
  name: "Sinomed",
  nameZh: "中国生物医学文献数据库",
  language: "zh",
  operators: { and: "AND", or: "OR", not: "NOT" },
  fields: [
    { key: "common", label: "常用字段", syntax: "[常用字段]" },
    { key: "title", label: "标题", syntax: "[标题]" },
    { key: "abstract", label: "摘要", syntax: "[摘要]" },
    { key: "keyword", label: "关键词", syntax: "[关键词]" },
    { key: "author", label: "作者", syntax: "[作者]" },
    { key: "mesh", label: "主题词", syntax: "[主题词]" },
    { key: "all", label: "全部字段", syntax: "[全部字段]" },
  ],
  defaultFields: ["common"],
  quoting: { exact: ['"', '"'], loose: ['"', '"'] },
  truncation: { right: null, internal: null, left: null },
  wildcards: { single: "?", multi: "%" },
  proximity: null,
  lineNumberFormat: "#{n}",
  supportsNesting: true,
  fieldQualifier: "[]",
  defaultSearchMode: "advanced",
  exportNotes: "Uses MeSH Chinese translation for subject searching. % replaces any number of characters, ? replaces one character.",
};

export const databaseRegistry: Record<string, DatabaseConfig> = {
  pubmed: pubmedConfig,
  wos: wosConfig,
  scopus: scopusConfig,
  embase: embaseConfig,
  ovid_medline: ovidMedlineConfig,
  cnki: cnkiConfig,
  wanfang: wanfangConfig,
  weipu: weipuConfig,
  sinomed: sinomedConfig,
};

export function getDatabaseConfig(id: string): DatabaseConfig | undefined {
  return databaseRegistry[id];
}

export function getAllDatabases(): DatabaseConfig[] {
  return Object.values(databaseRegistry);
}
```

- [ ] **Step 3: Write storage.ts for custom database persistence**

Write `lib/db-config/storage.ts`:
```typescript
import { DatabaseConfig } from "./types";
import { databaseRegistry, getDatabaseConfig } from "./registry";

const STORAGE_KEY = "searchbuilder-custom-dbs";

export function getCustomDatabases(): DatabaseConfig[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomDatabase(config: DatabaseConfig): void {
  const customs = getCustomDatabases();
  const idx = customs.findIndex((c) => c.id === config.id);
  if (idx >= 0) customs[idx] = config;
  else customs.push(config);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customs));
}

export function removeCustomDatabase(id: string): void {
  const customs = getCustomDatabases().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customs));
}

export function getAllDatabasesWithCustom(): DatabaseConfig[] {
  const builtin = Object.values(databaseRegistry);
  const customs = getCustomDatabases();
  return [...builtin, ...customs];
}
```

- [ ] **Step 4: Verify TypeScript compilation**

Run:
```bash
cd D:/terms && npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add lib/db-config/ && git commit -m "feat: add 9 database config registry with full syntax rules"
```

---

### Task 3: Built-in Thesaurus Data

**Files:**
- Create: `data/builtin-thesauri/mesh-en.json`
- Create: `data/builtin-thesauri/sinomed-zh.json`

- [ ] **Step 1: Create MeSH English thesaurus subset**

Write `data/builtin-thesauri/mesh-en.json`:
```json
[
  { "term": "Hypertension", "synonyms": ["High Blood Pressure", "Blood Pressure, High", "Elevated Blood Pressure", "HTN"], "category": "C14.907.489" },
  { "term": "Angiotensin-Converting Enzyme Inhibitors", "synonyms": ["ACE Inhibitors", "ACEI", "Angiotensin Converting Enzyme Antagonists", "Kinase II Inhibitors"], "category": "D08.811.277.656.300.048" },
  { "term": "Myocardial Infarction", "synonyms": ["Heart Attack", "MI", "Myocardial Infarct", "Cardiac Infarction", "Coronary Occlusion"], "category": "C14.280.647.500" },
  { "term": "Diabetes Mellitus", "synonyms": ["DM", "Diabetes", "Type 1 Diabetes", "Type 2 Diabetes", "T1DM", "T2DM", "Insulin Dependent Diabetes"], "category": "C19.246" },
  { "term": "Stroke", "synonyms": ["Cerebrovascular Accident", "CVA", "Brain Ischemia", "Cerebral Infarction", "Brain Attack", "Ischemic Stroke", "Hemorrhagic Stroke"], "category": "C10.228.140.300.775" },
  { "term": "Renal Insufficiency", "synonyms": ["Kidney Failure", "Renal Failure", "Kidney Insufficiency", "Chronic Kidney Disease", "CKD", "End Stage Renal Disease", "ESRD", "Nephropathy"], "category": "C12.777.419.780" },
  { "term": "Neoplasms", "synonyms": ["Cancer", "Tumor", "Malignancy", "Carcinoma", "Sarcoma", "Malignant Neoplasm", "Oncology"], "category": "C04" },
  { "term": "COVID-19", "synonyms": ["SARS-CoV-2", "Coronavirus Disease 2019", "2019-nCoV", "Novel Coronavirus", "Severe Acute Respiratory Syndrome Coronavirus 2", "COVID"], "category": "C01.925.782" },
  { "term": "Heart Failure", "synonyms": ["Cardiac Failure", "Congestive Heart Failure", "CHF", "Ventricular Dysfunction", "Cardiac Insufficiency", "Myocardial Failure"], "category": "C14.280.434" },
  { "term": "Alzheimer Disease", "synonyms": ["Alzheimer's Disease", "Alzheimer Dementia", "AD", "Senile Dementia", "Alzheimer Type Dementia", "Late Onset Alzheimer Disease"], "category": "C10.228.140.380.100" },
  { "term": "Asthma", "synonyms": ["Bronchial Asthma", "Asthmatic", "Reactive Airway Disease", "Wheezing", "Bronchospasm"], "category": "C08.127.108" },
  { "term": "Obesity", "synonyms": ["Overweight", "Adiposity", "Morbid Obesity", "Excess Body Weight", "BMI", "Body Mass Index"], "category": "C18.654.726.500" },
  { "term": "Depression", "synonyms": ["Major Depressive Disorder", "MDD", "Clinical Depression", "Dysthymia", "Depressive Symptoms", "Melancholia"], "category": "F03.600.300" },
  { "term": "Randomized Controlled Trial", "synonyms": ["RCT", "Randomized Clinical Trial", "Controlled Clinical Trial", "Random Allocation", "Double-Blind"], "category": "V03.200" },
  { "term": "Meta-Analysis", "synonyms": ["Systematic Review", "Meta Analysis", "Pooled Analysis", "Data Synthesis", "Literature Review"], "category": "V03.600" },
  { "term": "Biomarkers", "synonyms": ["Biological Markers", "Surrogate Markers", "Molecular Markers", "Prognostic Marker", "Diagnostic Marker", "Predictive Marker"], "category": "D23.101" },
  { "term": "Inflammation", "synonyms": ["Inflammatory Response", "Chronic Inflammation", "Acute Inflammation", "Proinflammatory", "Anti-inflammatory", "Cytokine Storm"], "category": "C23.550.470" },
  { "term": "Apoptosis", "synonyms": ["Programmed Cell Death", "Cell Death", "Apoptotic", "Caspase Activation", "DNA Fragmentation"], "category": "G04.146.160.100" },
  { "term": "Oxidative Stress", "synonyms": ["Oxidative Damage", "Reactive Oxygen Species", "ROS", "Free Radicals", "Lipid Peroxidation", "Antioxidant Capacity"], "category": "G03.673" },
  { "term": "Antibodies, Monoclonal", "synonyms": ["Monoclonal Antibodies", "mAb", "Hybridoma", "Therapeutic Antibodies", "Biologics", "Biological Therapy"], "category": "D12.776.124.486.485.114.224" }
]
```

- [ ] **Step 2: Create Sinomed Chinese thesaurus subset**

Write `data/builtin-thesauri/sinomed-zh.json`:
```json
[
  { "term": "高血压", "synonyms": ["血压升高", "舒张压升高", "HTN", "原发性高血压", "继发性高血压", "高血压病"], "category": "心血管疾病" },
  { "term": "血管紧张素转换酶抑制药", "synonyms": ["ACEI", "ACE抑制剂", "血管紧张素转化酶抑制剂", "卡托普利", "依那普利", "雷米普利"], "category": "心血管药物" },
  { "term": "心肌梗死", "synonyms": ["心梗", "心肌梗塞", "MI", "急性心肌梗死", "心脏骤停", "冠心病急性事件"], "category": "心血管疾病" },
  { "term": "糖尿病", "synonyms": ["DM", "1型糖尿病", "2型糖尿病", "T1DM", "T2DM", "消渴病", "胰岛素依赖型糖尿病"], "category": "内分泌疾病" },
  { "term": "卒中", "synonyms": ["中风", "脑卒中", "脑血管意外", "脑梗死", "CVA", "脑出血", "缺血性脑卒中", "出血性脑卒中"], "category": "神经系统疾病" },
  { "term": "肾功能衰竭", "synonyms": ["肾衰竭", "肾功能不全", "慢性肾病", "CKD", "终末期肾病", "肾病", "蛋白尿", "尿毒症"], "category": "泌尿系统疾病" },
  { "term": "肿瘤", "synonyms": ["癌症", "恶性肿瘤", "癌", "肉瘤", "新生物", "肿瘤学"], "category": "肿瘤学" },
  { "term": "新型冠状病毒肺炎", "synonyms": ["新冠肺炎", "COVID-19", "SARS-CoV-2", "2019冠状病毒病", "新型冠状病毒感染"], "category": "传染病" },
  { "term": "心力衰竭", "synonyms": ["心衰", "CHF", "充血性心力衰竭", "心功能不全", "心肌衰竭", "心室功能障碍"], "category": "心血管疾病" },
  { "term": "阿尔茨海默病", "synonyms": ["老年痴呆", "阿尔茨海默症", "AD", "老年性痴呆", "认知障碍", "痴呆"], "category": "神经系统疾病" },
  { "term": "哮喘", "synonyms": ["支气管哮喘", "气喘", "喘息", "支气管痉挛", "变应性哮喘", "气道高反应"], "category": "呼吸系统疾病" },
  { "term": "肥胖症", "synonyms": ["肥胖", "超重", "BMI超标", "体重指数升高", "向心性肥胖", "腹型肥胖"], "category": "代谢疾病" },
  { "term": "抑郁症", "synonyms": ["抑郁", "MDD", "忧郁症", "重性抑郁障碍", "心境障碍", "抑郁发作"], "category": "精神疾病" },
  { "term": "随机对照试验", "synonyms": ["RCT", "随机临床试验", "临床对照试验", "随机分配", "双盲试验", "对照研究"], "category": "研究方法" },
  { "term": "Meta分析", "synonyms": ["荟萃分析", "系统评价", "系统综述", "文献汇总分析", "合并分析", "Meta分析"], "category": "研究方法" },
  { "term": "生物标志物", "synonyms": ["生物学标志", "生物标记物", "分子标志物", "预后标志物", "诊断标志物", "预测标志物"], "category": "诊断学" },
  { "term": "炎症", "synonyms": ["炎性反应", "炎症反应", "慢性炎症", "急性炎症", "炎性因子", "促炎", "抗炎"], "category": "病理学" },
  { "term": "细胞凋亡", "synonyms": ["凋亡", "程序性细胞死亡", "PCD", "细胞程序性死亡", "半胱天冬酶激活", "DNA断裂"], "category": "细胞生物学" },
  { "term": "氧化应激", "synonyms": ["氧化损伤", "ROS", "活性氧", "自由基", "脂质过氧化", "抗氧化能力", "氧自由基"], "category": "病理生理学" },
  { "term": "单克隆抗体", "synonyms": ["mAb", "单抗", "治疗性抗体", "生物制剂", "靶向药物", "免疫治疗"], "category": "药学" }
]
```

- [ ] **Step 3: Commit**

```bash
git add data/ && git commit -m "feat: add built-in MeSH English and Sinomed Chinese thesauri"
```

---

### Task 4: Synonym Engine

**Files:**
- Create: `lib/synonyms/cache.ts`
- Create: `lib/synonyms/fetchers/pubmed.ts`
- Create: `lib/synonyms/engine.ts`

- [ ] **Step 1: Write cache module**

Write `lib/synonyms/cache.ts`:
```typescript
export interface SynonymResult {
  standardTerm: string;
  synonyms: string[];
  source: "builtin" | "api" | "custom" | "fuzzy";
  confidence: "high" | "medium" | "manual";
}

const cache = new Map<string, SynonymResult>();

export function getCached(term: string): SynonymResult | undefined {
  return cache.get(term.toLowerCase());
}

export function setCache(term: string, result: SynonymResult): void {
  cache.set(term.toLowerCase(), result);
}

export function loadCacheFromStorage(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("synonym-cache");
    if (raw) {
      const entries: [string, SynonymResult][] = JSON.parse(raw);
      entries.forEach(([k, v]) => cache.set(k, v));
    }
  } catch { /* ignore */ }
}

export function persistCache(): void {
  if (typeof window === "undefined") return;
  const entries = Array.from(cache.entries());
  localStorage.setItem("synonym-cache", JSON.stringify(entries));
}
```

- [ ] **Step 2: Write PubMed MeSH fetcher**

Write `lib/synonyms/fetchers/pubmed.ts`:
```typescript
import { SynonymResult } from "../cache";

export async function fetchMeshSynonyms(term: string): Promise<SynonymResult | null> {
  try {
    const baseUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
    // Step 1: Search for MeSH term
    const searchUrl = `${baseUrl}/esearch.fcgi?db=mesh&term=${encodeURIComponent(term)}&retmax=1&retmode=json`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const ids = searchData?.esearchresult?.idlist;
    if (!ids || ids.length === 0) return null;

    // Step 2: Fetch MeSH record
    const fetchUrl = `${baseUrl}/efetch.fcgi?db=mesh&id=${ids[0]}&retmode=xml`;
    const fetchRes = await fetch(fetchUrl);
    const xml = await fetchRes.text();

    // Step 3: Parse XML for entry terms
    const entryTerms: string[] = [];
    const regex = /<EntryTerm[^>]*>([^<]+)<\/EntryTerm>/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
      entryTerms.push(match[1]);
    }

    if (entryTerms.length === 0) return null;

    return {
      standardTerm: term,
      synonyms: entryTerms.filter((t) => t.toLowerCase() !== term.toLowerCase()),
      source: "api",
      confidence: "high",
    };
  } catch {
    return null;
  }
}
```

- [ ] **Step 3: Write synonym matching engine**

Write `lib/synonyms/engine.ts`:
```typescript
import { getCached, setCache, SynonymResult } from "./cache";
import { fetchMeshSynonyms } from "./fetchers/pubmed";
import meshData from "@/data/builtin-thesauri/mesh-en.json";
import sinomedData from "@/data/builtin-thesauri/sinomed-zh.json";

function searchBuiltin(term: string, entries: { term: string; synonyms: string[] }[]): SynonymResult | null {
  const lower = term.toLowerCase();
  for (const entry of entries) {
    if (entry.term.toLowerCase() === lower || entry.synonyms.some((s) => s.toLowerCase() === lower)) {
      return {
        standardTerm: entry.term,
        synonyms: entry.synonyms.filter((s) => s.toLowerCase() !== lower),
        source: "builtin",
        confidence: "high",
      };
    }
  }
  return null;
}

function fuzzyMatch(term: string, entries: { term: string; synonyms: string[] }[]): SynonymResult | null {
  const lower = term.toLowerCase();
  if (lower.length < 4) return null;

  for (const entry of entries) {
    const allTerms = [entry.term, ...entry.synonyms];
    for (const t of allTerms) {
      const d = levenshteinDistance(lower, t.toLowerCase());
      if (d <= 2) {
        return {
          standardTerm: entry.term,
          synonyms: entry.synonyms.filter((s) => s.toLowerCase() !== lower),
          source: "fuzzy",
          confidence: "manual",
        };
      }
    }
  }
  return null;
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export async function findSynonyms(term: string, language: "en" | "zh" = "en"): Promise<SynonymResult> {
  // 1. Cache check
  const cached = getCached(term);
  if (cached) return cached;

  // 2. Built-in thesaurus lookup
  const entries = language === "zh" ? sinomedData : meshData;
  const builtin = searchBuiltin(term, entries);
  if (builtin) { setCache(term, builtin); return builtin; }

  // 3. API lookup (PubMed for English only)
  if (language === "en") {
    const apiResult = await fetchMeshSynonyms(term);
    if (apiResult) { setCache(term, apiResult); return apiResult; }
  }

  // 4. Fuzzy match
  const fuzzy = fuzzyMatch(term, entries);
  if (fuzzy) { setCache(term, fuzzy); return fuzzy; }

  // 5. No match — return the term itself
  const noMatch: SynonymResult = {
    standardTerm: term,
    synonyms: [],
    source: "custom",
    confidence: "manual",
  };
  setCache(term, noMatch);
  return noMatch;
}

export async function batchFindSynonyms(
  keywords: { term: string; concept: string }[],
  language: "en" | "zh"
): Promise<Map<string, SynonymResult>> {
  const results = new Map<string, SynonymResult>();
  await Promise.all(
    keywords.map(async (kw) => {
      const result = await findSynonyms(kw.term, language);
      results.set(kw.term, result);
    })
  );
  return results;
}
```

- [ ] **Step 4: Verify TypeScript compilation**

Run:
```bash
cd D:/terms && npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add lib/synonyms/ && git commit -m "feat: add synonym matching engine with cache, builtin, API, and fuzzy match"
```

---

### Task 5: Query Builder

**Files:**
- Create: `lib/query-builder/formatter.ts`
- Create: `lib/query-builder/generator.ts`

- [ ] **Step 1: Write formatter.ts**

Write `lib/query-builder/formatter.ts`:
```typescript
import { DatabaseConfig } from "@/lib/db-config/types";

export function formatTerm(term: string, config: DatabaseConfig): string {
  const hasSpace = term.includes(" ");
  if (hasSpace) {
    const [open, close] = config.quoting.exact;
    return `${open}${term}${close}`;
  }
  return term;
}

export function applyTruncation(term: string, config: DatabaseConfig): string {
  if (config.truncation.right) {
    return term + config.truncation.right;
  }
  return term;
}

export function formatFieldQualifier(term: string, fieldKey: string, config: DatabaseConfig): string {
  const field = config.fields.find((f) => f.key === fieldKey);
  if (!field) return term;

  if (config.fieldQualifier === "[]") {
    return `${term}${field.syntax}`;
  }
  if (config.fieldQualifier === "=") {
    return `${field.syntax}${term}`;
  }
  if (config.fieldQualifier === "()") {
    return `${field.syntax}(${term})`;
  }
  if (config.fieldQualifier === ":") {
    return `${term}${field.syntax}`;
  }
  if (config.fieldQualifier === ".") {
    return `${term}${field.syntax}`;
  }
  return term;
}

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

export function buildFinalLine(
  lineNumbers: number[],
  config: DatabaseConfig
): string {
  return lineNumbers
    .map((n) => config.lineNumberFormat.replace("{n}", String(n)))
    .join(` ${config.operators.and} `);
}
```

- [ ] **Step 2: Write generator.ts**

Write `lib/query-builder/generator.ts`:
```typescript
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

export function generateQueries(
  concepts: ConceptGroup[],
  config: DatabaseConfig
): GeneratedQueries {
  const fieldKey = config.defaultFields[0];
  const field = config.fields.find((f) => f.key === fieldKey);
  const fieldLabel = field?.label || fieldKey;

  const lines: QueryLine[] = concepts.map((concept, i) => {
    // Flatten keywords + synonyms into a deduplicated list
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

export function generateForMultipleDatabases(
  concepts: ConceptGroup[],
  configs: DatabaseConfig[]
): GeneratedQueries[] {
  return configs.map((config) => generateQueries(concepts, config));
}
```

- [ ] **Step 3: Verify TypeScript compilation**

Run:
```bash
cd D:/terms && npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add lib/query-builder/ && git commit -m "feat: add query builder with per-database syntax formatting"
```

---

### Task 6: LLM Client & Templates

**Files:**
- Create: `lib/llm/client.ts`
- Create: `lib/llm/prompts.ts`
- Create: `lib/llm/validator.ts`

- [ ] **Step 1: Write LLM client**

Write `lib/llm/client.ts`:
```typescript
export async function callLLM(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.GLM5_API_KEY;
  const baseUrl = process.env.GLM5_BASE_URL || "https://api.z.ai/api/anthropic";

  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "glm-5",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || "";
}
```

- [ ] **Step 2: Write prompt templates**

Write `lib/llm/prompts.ts`:
```typescript
import { DatabaseConfig } from "@/lib/db-config/types";

export function buildSystemPrompt(config: DatabaseConfig): string {
  return `You are a senior medical librarian and systematic review search expert. Generate professional search queries for ${config.name} using ONLY the exact syntax rules below.

## CRITICAL: Database-Specific Syntax for ${config.name}

Boolean Operators:
- AND = "${config.operators.and}"
- OR = "${config.operators.or}"
- NOT = "${config.operators.not}"

Phrase Quoting: ${config.quoting.exact[0]}phrase${config.quoting.exact[1]}
Exact Match: ${config.quoting.exact[0]}term${config.quoting.exact[1]}
Truncation: ${config.truncation.right ? `"${config.truncation.right}" (right-hand)` : "not supported"}
Internal Wildcard: ${config.wildcards.single ? `"${config.wildcards.single}" (single char)` : "not supported"}
${config.wildcards.multi ? `Multi Wildcard: "${config.wildcards.multi}" (multi char)` : ""}
${config.proximity ? `Proximity: "${config.proximity.syntax}" (max ${config.proximity.maxDistance})` : "Proximity: NOT SUPPORTED — do not use any proximity operators"}
${config.proximity?.ordered ? `Ordered Proximity: "${config.proximity.ordered}"` : ""}

Field Syntax:
${config.fields.map((f) => `- ${f.label}: \`${f.syntax}\``).join("\n")}
Default fields to use: ${config.defaultFields.join(", ")}

Line Number Format: ${config.lineNumberFormat}
Nesting: ${config.supportsNesting ? "Supports nested parentheses" : "Use parentheses carefully"}
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
    { "step": 1, "concept": "name", "query": "full query line", "fieldUsed": "field" }
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
```

- [ ] **Step 3: Write validator**

Write `lib/llm/validator.ts`:
```typescript
import { DatabaseConfig } from "@/lib/db-config/types";

export interface ValidationError {
  line: number;
  message: string;
}

export function validateQuery(queryText: string, config: DatabaseConfig): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = queryText.split("\n").filter((l) => l.trim());

  lines.forEach((line, i) => {
    // Check brackets/parentheses pairing
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push({ line: i + 1, message: "Mismatched parentheses" });
    }

    // Check truncation usage
    if (config.truncation.right === null && line.includes("*")) {
      errors.push({ line: i + 1, message: `Truncation (*) is not supported in ${config.name}` });
    }

    // Check proximity syntax for databases that don't support it
    if (!config.proximity && (line.includes("NEAR") || line.includes("ADJ") || line.includes("PRE/") || line.includes("W/"))) {
      errors.push({ line: i + 1, message: `Proximity operators are not supported in ${config.name}` });
    }
  });

  return errors;
}
```

- [ ] **Step 4: Verify TypeScript compilation**

Run:
```bash
cd D:/terms && npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add lib/llm/ && git commit -m "feat: add LLM client with GLM-5 prompts and output validator"
```

---

### Task 7: Export Module

**Files:**
- Create: `lib/export/excel.ts`
- Create: `lib/export/csv.ts`
- Create: `lib/export/json-export.ts`

- [ ] **Step 1: Write CSV export**

Write `lib/export/csv.ts`:
```typescript
import { GeneratedQueries } from "@/lib/query-builder/generator";

export function generateCSV(results: GeneratedQueries[]): string {
  const headers = ["Step", "Concept", ...results.map((r) => r.database)];
  const rows: string[][] = [];

  // Header row
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

  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
}
```

- [ ] **Step 2: Write Excel export using exceljs**

Write `lib/export/excel.ts`:
```typescript
import ExcelJS from "exceljs";
import { GeneratedQueries } from "@/lib/query-builder/generator";

export async function generateExcelBuffer(results: GeneratedQueries[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Search Queries");

  // Headers
  const headers = ["Step", "Concept", ...results.map((r) => r.database)];
  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true, size: 11 };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFE9DE" } };

  // Data rows
  const maxLines = Math.max(...results.map((r) => r.lines.length));
  for (let i = 0; i < maxLines; i++) {
    const row: string[] = [];
    const firstLine = results[0]?.lines[i];
    row.push(firstLine ? `#${firstLine.step}` : "");
    row.push(firstLine?.concept || "");
    results.forEach((r) => row.push(r.lines[i]?.query || ""));
    const dataRow = sheet.addRow(row);
    dataRow.font = { name: "JetBrains Mono", size: 11 };
    if (i % 2 === 0) {
      dataRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAF9F5" } };
    }
  }

  // Final row
  const finalRowData = ["Final", "AND"];
  results.forEach((r) => finalRowData.push(r.final));
  const finalRow = sheet.addRow(finalRowData);
  finalRow.font = { bold: true, name: "JetBrains Mono", size: 11 };
  finalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFE9DE" } };

  // Column widths
  sheet.getColumn(1).width = 8;
  sheet.getColumn(2).width = 12;
  for (let i = 0; i < results.length; i++) {
    sheet.getColumn(3 + i).width = 60;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
```

- [ ] **Step 3: Write JSON export**

Write `lib/export/json-export.ts`:
```typescript
import { GeneratedQueries } from "@/lib/query-builder/generator";

export function generateJSON(results: GeneratedQueries[], concepts?: unknown): object {
  return {
    generatedAt: new Date().toISOString(),
    databases: results.map((r) => r.database),
    queries: results,
    concepts: concepts || null,
  };
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/export/ && git commit -m "feat: add export module (Excel, CSV, JSON)"
```

---

### Task 8: API Routes

**Files:**
- Create: `app/api/synonyms/lookup/route.ts`
- Create: `app/api/generate/code/route.ts`
- Create: `app/api/generate/llm/route.ts`
- Create: `app/api/export/[format]/route.ts`

- [ ] **Step 1: Write synonym lookup API route**

Write `app/api/synonyms/lookup/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { findSynonyms } from "@/lib/synonyms/engine";

export async function GET(req: NextRequest) {
  const term = req.nextUrl.searchParams.get("term");
  const lang = (req.nextUrl.searchParams.get("lang") as "en" | "zh") || "en";

  if (!term) {
    return NextResponse.json({ error: "Missing 'term' parameter" }, { status: 400 });
  }

  const result = await findSynonyms(term, lang);
  return NextResponse.json(result);
}
```

- [ ] **Step 2: Write code generation API route**

Write `app/api/generate/code/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { generateForMultipleDatabases, ConceptGroup } from "@/lib/query-builder/generator";
import { getAllDatabasesWithCustom } from "@/lib/db-config/storage";
import { DatabaseConfig } from "@/lib/db-config/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { concepts, databaseIds } = body as {
    concepts: ConceptGroup[];
    databaseIds: string[];
  };

  if (!concepts || !databaseIds) {
    return NextResponse.json({ error: "Missing 'concepts' or 'databaseIds'" }, { status: 400 });
  }

  const allDbs = getAllDatabasesWithCustom();
  const configs: DatabaseConfig[] = databaseIds
    .map((id) => allDbs.find((db) => db.id === id))
    .filter(Boolean) as DatabaseConfig[];

  if (configs.length === 0) {
    return NextResponse.json({ error: "No valid databases selected" }, { status: 400 });
  }

  const results = generateForMultipleDatabases(concepts, configs);
  return NextResponse.json({ results });
}
```

- [ ] **Step 3: Write LLM generation API route**

Write `app/api/generate/llm/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { callLLM } from "@/lib/llm/client";
import { buildSystemPrompt, buildUserMessage } from "@/lib/llm/prompts";
import { validateQuery } from "@/lib/llm/validator";
import { getDatabaseConfig } from "@/lib/db-config/registry";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { concepts, topic, databaseId, synonymRefs } = body as {
    concepts: { name: string; terms: string[] }[];
    topic: string;
    databaseId: string;
    synonymRefs: Record<string, string[]>;
  };

  if (!databaseId || !concepts) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const config = getDatabaseConfig(databaseId);
  if (!config) {
    return NextResponse.json({ error: `Unknown database: ${databaseId}` }, { status: 400 });
  }

  const systemPrompt = buildSystemPrompt(config);
  const userMessage = buildUserMessage(concepts, synonymRefs, topic);

  let retries = 0;
  let lastResult = "";
  const MAX_RETRIES = 2;

  while (retries <= MAX_RETRIES) {
    try {
      const raw = await callLLM(systemPrompt, userMessage);
      lastResult = raw;

      // Extract JSON from response
      const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : raw;
      const parsed = JSON.parse(jsonStr);

      // Validate syntax
      const allQueries = [...parsed.lines.map((l: { query: string }) => l.query), parsed.final || ""].join("\n");
      const errors = validateQuery(allQueries, config);

      if (errors.length === 0 || retries === MAX_RETRIES) {
        return NextResponse.json({ ...parsed, databaseId, validationErrors: errors });
      }

      retries++;
    } catch (e) {
      if (retries === MAX_RETRIES) {
        return NextResponse.json({
          error: "LLM generation failed after retries",
          raw: lastResult,
          details: String(e),
        }, { status: 500 });
      }
      retries++;
    }
  }
}
```

- [ ] **Step 4: Write export API route**

Write `app/api/export/[format]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { generateExcelBuffer } from "@/lib/export/excel";
import { generateCSV } from "@/lib/export/csv";
import { generateJSON } from "@/lib/export/json-export";

export async function POST(
  req: NextRequest,
  { params }: { params: { format: string } }
) {
  const body = await req.json();
  const { results, concepts } = body;

  if (!results) {
    return NextResponse.json({ error: "Missing results" }, { status: 400 });
  }

  switch (params.format) {
    case "xlsx": {
      const buffer = await generateExcelBuffer(results);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": "attachment; filename=search-queries.xlsx",
        },
      });
    }
    case "csv": {
      const csv = generateCSV(results);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=search-queries.csv",
        },
      });
    }
    case "json": {
      const json = generateJSON(results, concepts);
      return NextResponse.json(json);
    }
    default:
      return NextResponse.json({ error: `Unsupported format: ${params.format}` }, { status: 400 });
  }
}
```

- [ ] **Step 5: Verify TypeScript compilation**

Run:
```bash
cd D:/terms && npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add app/api/ && git commit -m "feat: add API routes for synonyms, generation, and export"
```

---

### Task 9: Frontend Components

**Files:**
- Create: `components/TopNav.tsx`
- Create: `components/Footer.tsx`
- Create: `components/StepIndicator.tsx`
- Create: `components/ConceptEditor.tsx`
- Create: `components/SynonymReview.tsx`
- Create: `components/DatabaseSelector.tsx`
- Create: `components/ModeToggle.tsx`
- Create: `components/QueryPreviewTable.tsx`
- Create: `components/CodeWindow.tsx`
- Create: `components/ExportPanel.tsx`

- [ ] **Step 1: Write TopNav component**

Write `components/TopNav.tsx`:
```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopNav() {
  const pathname = usePathname();
  const links = [
    { href: "/builder", label: "构建器" },
    { href: "/settings", label: "数据库配置" },
  ];

  return (
    <nav className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 md:px-12 bg-canvas/90 backdrop-blur-sm border-b border-hairline">
      <Link href="/" className="flex items-center gap-1.5 font-display text-xl tracking-[-0.3px] text-ink no-underline">
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="shrink-0">
          <circle cx="7" cy="7" r="1.8" fill="currentColor"/>
          <line x1="7" y1="0" x2="7" y2="5.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="7" y1="8.8" x2="7" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="0" y1="7" x2="5.2" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="8.8" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        SearchBuilder
      </Link>
      <div className="hidden md:flex gap-8">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm font-medium pb-0.5 border-b-2 transition-colors no-underline ${
              pathname === l.href
                ? "text-ink border-primary"
                : "text-muted border-transparent hover:text-ink"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Link href="/builder" className="btn-primary btn-sm text-xs no-underline">
          新建项目
        </Link>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Write Footer component**

Write `components/Footer.tsx`:
```tsx
export default function Footer() {
  const cols = [
    { title: "英文数据库", links: ["PubMed", "Web of Science", "Scopus", "Embase", "Ovid MEDLINE"] },
    { title: "中文数据库", links: ["CNKI 中国知网", "万方数据", "维普中文期刊", "Sinomed"] },
    { title: "功能", links: ["自动同义词匹配", "LLM 辅助生成", "数据库配置管理"] },
    { title: "关于", links: ["使用说明", "数据库语法参考"] },
  ];

  return (
    <footer className="bg-surface-dark text-on-dark-soft text-sm py-16 px-12">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {cols.map((col) => (
          <div key={col.title}>
            <h4 className="text-[11px] font-medium tracking-[1.5px] uppercase text-on-dark mb-4">{col.title}</h4>
            {col.links.map((l) => (
              <span key={l} className="block leading-loose cursor-pointer hover:text-on-dark transition-colors">{l}</span>
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Write StepIndicator component**

Write `components/StepIndicator.tsx`:
```tsx
const STEPS = [
  { num: 1, label: "概念与关键词" },
  { num: 2, label: "同义词匹配" },
  { num: 3, label: "数据库与模式" },
  { num: 4, label: "检索式预览" },
  { num: 5, label: "导出" },
];

export default function StepIndicator({ currentStep, onStepClick }: {
  currentStep: number;
  onStepClick?: (step: number) => void;
}) {
  return (
    <div className="flex flex-col md:flex-row gap-0.5 md:gap-0 mx-6 md:mx-12 mb-12 md:bg-surface-card md:rounded-lg md:p-1">
      {STEPS.map((s) => {
        const isDone = s.num < currentStep;
        const isActive = s.num === currentStep;
        return (
          <button
            key={s.num}
            onClick={() => onStepClick?.(s.num)}
            className={`flex md:flex-col items-center gap-3 md:gap-0 px-4 py-2.5 md:py-3.5 rounded-md text-left md:text-center text-[13px] font-medium transition-colors ${
              isActive
                ? "bg-canvas text-ink md:shadow-[0_1px_3px_rgba(20,20,19,0.06)] md:border md:border-hairline"
                : isDone
                  ? "bg-surface-card text-semantic-success"
                  : "bg-surface-card text-muted"
            }`}
          >
            <span className={`text-[11px] font-medium tracking-[1.5px] uppercase md:block md:mb-1 ${
              isActive ? "text-primary" : isDone ? "text-semantic-success" : "text-muted-soft"
            }`}>Step {s.num}</span>
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Write ConceptEditor component**

Write `components/ConceptEditor.tsx`:
```tsx
"use client";
import { useState } from "react";

export interface ConceptData {
  name: string;
  keywords: string[];
}

export default function ConceptEditor({ concepts, onChange }: {
  concepts: ConceptData[];
  onChange: (concepts: ConceptData[]) => void;
}) {
  const [newConceptName, setNewConceptName] = useState("");
  const [newKeyword, setNewKeyword] = useState<Record<string, string>>({});

  const addConcept = () => {
    if (!newConceptName.trim()) return;
    onChange([...concepts, { name: newConceptName.trim(), keywords: [] }]);
    setNewConceptName("");
  };

  const addKeyword = (conceptIdx: number) => {
    const key = String(conceptIdx);
    const kw = (newKeyword[key] || "").trim();
    if (!kw) return;
    const updated = concepts.map((c, i) =>
      i === conceptIdx ? { ...c, keywords: [...c.keywords, kw] } : c
    );
    onChange(updated);
    setNewKeyword({ ...newKeyword, [key]: "" });
  };

  const removeKeyword = (conceptIdx: number, kwIdx: number) => {
    const updated = concepts.map((c, i) =>
      i === conceptIdx ? { ...c, keywords: c.keywords.filter((_, j) => j !== kwIdx) } : c
    );
    onChange(updated);
  };

  const removeConcept = (conceptIdx: number) => {
    onChange(concepts.filter((_, i) => i !== conceptIdx));
  };

  return (
    <div>
      {concepts.map((c, ci) => (
        <div key={ci} className="border-l-2 border-hairline pl-6 mb-5" style={{
          borderLeftColor: ci === 0 ? "var(--primary, #cc785c)" : ci === 1 ? "var(--accent-teal, #5db8a6)" : "var(--accent-amber, #e8a55a)"
        }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-medium tracking-[1.5px] uppercase text-muted">
              概念 {ci + 1} · {c.name}
            </p>
            <button onClick={() => removeConcept(ci)} className="text-xs text-muted-soft hover:text-semantic-error">删除</button>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {c.keywords.map((kw, ki) => (
              <span key={ki} className="inline-flex items-center gap-1 px-3 py-1 rounded-pill text-[13px] font-medium bg-surface-soft border border-hairline-soft text-ink-body">
                {kw}
                <button onClick={() => removeKeyword(ci, ki)} className="w-4 h-4 rounded-full inline-flex items-center justify-center text-[10px] opacity-40 hover:opacity-100">&times;</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="text-input flex-1"
              placeholder="输入关键词后按 Enter"
              value={newKeyword[String(ci)] || ""}
              onChange={(e) => setNewKeyword({ ...newKeyword, [String(ci)]: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") addKeyword(ci); }}
            />
            <button onClick={() => addKeyword(ci)} className="btn-secondary btn-sm">添加</button>
          </div>
        </div>
      ))}
      <div className="flex gap-2 mt-6">
        <input
          className="text-input flex-1"
          placeholder="输入新概念名称..."
          value={newConceptName}
          onChange={(e) => setNewConceptName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addConcept(); }}
        />
        <button onClick={addConcept} className="btn-secondary btn-sm">+ 添加概念</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Write SynonymReview component**

Write `components/SynonymReview.tsx`:
```tsx
"use client";
import { useState, useEffect } from "react";
import { SynonymResult } from "@/lib/synonyms/cache";

export default function SynonymReview({ keywords, language, onConfirmed }: {
  keywords: { term: string; concept: string }[];
  language: "en" | "zh";
  onConfirmed: (results: Map<string, string[]>) => void;
}) {
  const [matches, setMatches] = useState<Map<string, SynonymResult>>(new Map());
  const [loading, setLoading] = useState(true);
  const [customSynonyms, setCustomSynonyms] = useState<Record<string, string[]>>({});
  const [newSynInputs, setNewSynInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      const results = new Map<string, SynonymResult>();
      for (const kw of keywords) {
        const res = await fetch(`/api/synonyms/lookup?term=${encodeURIComponent(kw.term)}&lang=${language}`);
        if (res.ok) {
          results.set(kw.term, await res.json());
        }
      }
      setMatches(results);
      setLoading(false);
    })();
  }, [keywords, language]);

  const toggleSynonym = (keyword: string, synonym: string) => {
    const current = customSynonyms[keyword] || matches.get(keyword)?.synonyms || [];
    const updated = current.includes(synonym)
      ? current.filter((s) => s !== synonym)
      : [...current, synonym];
    setCustomSynonyms({ ...customSynonyms, [keyword]: updated });
  };

  const addCustomSynonym = (keyword: string) => {
    const val = (newSynInputs[keyword] || "").trim();
    if (!val) return;
    const current = customSynonyms[keyword] || matches.get(keyword)?.synonyms || [];
    setCustomSynonyms({ ...customSynonyms, [keyword]: [...current, val] });
    setNewSynInputs({ ...newSynInputs, [keyword]: "" });
  };

  const handleConfirm = () => {
    const result = new Map<string, string[]>();
    for (const kw of keywords) {
      const syns = customSynonyms[kw.term] || matches.get(kw.term)?.synonyms || [];
      result.set(kw.term, syns);
    }
    onConfirmed(result);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {keywords.map((kw) => (
          <div key={kw.term} className="animate-pulse bg-surface-card rounded-lg p-6">
            <div className="h-4 bg-surface-soft rounded w-32 mb-3" />
            <div className="flex gap-2"><div className="h-6 bg-surface-soft rounded-pill w-16" /><div className="h-6 bg-surface-soft rounded-pill w-20" /></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {keywords.map((kw) => {
        const match = matches.get(kw.term);
        const selSyns = customSynonyms[kw.term] || match?.synonyms || [];
        return (
          <div key={kw.term} className="border-l-2 border-hairline pl-6 mb-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-pill text-[13px] font-medium bg-primary text-white">{kw.term}</span>
              <span className="text-[11px] font-medium tracking-[1.5px] uppercase text-muted">{kw.concept}</span>
              {match && <span className="text-[11px] text-muted-soft">via {match.source} ({match.confidence})</span>}
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {match?.synonyms.map((syn) => {
                const selected = selSyns.includes(syn);
                return (
                  <button
                    key={syn}
                    onClick={() => toggleSynonym(kw.term, syn)}
                    className={`px-3 py-1 rounded-pill text-[13px] font-medium border transition-colors ${
                      selected
                        ? "bg-[#dcebda] border-semantic-success text-[#2d5a27]"
                        : "bg-surface-soft border-hairline-soft text-ink-body hover:border-muted"
                    }`}
                  >
                    {syn}
                  </button>
                );
              })}
              {match?.synonyms.length === 0 && <span className="text-[13px] text-muted-soft italic">未匹配到同义词</span>}
            </div>
            <div className="flex gap-2">
              <input
                className="text-input flex-1"
                placeholder="手动添加同义词..."
                value={newSynInputs[kw.term] || ""}
                onChange={(e) => setNewSynInputs({ ...newSynInputs, [kw.term]: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") addCustomSynonym(kw.term); }}
              />
              <button onClick={() => addCustomSynonym(kw.term)} className="btn-secondary btn-sm">+ 添加</button>
            </div>
          </div>
        );
      })}
      <div className="text-right mt-6">
        <button onClick={handleConfirm} className="btn-primary">确认同义词，下一步</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Write remaining components**

Write `components/DatabaseSelector.tsx`:
```tsx
"use client";
import { DatabaseConfig } from "@/lib/db-config/types";

export default function DatabaseSelector({ databases, selected, onToggle }: {
  databases: DatabaseConfig[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {databases.map((db) => {
        const isActive = selected.includes(db.id);
        return (
          <button
            key={db.id}
            onClick={() => onToggle(db.id)}
            className={`px-4 py-[7px] rounded-pill text-[13px] font-medium border transition-all ${
              isActive
                ? "bg-surface-dark text-on-dark border-surface-dark hover:bg-surface-dark-elevated"
                : "bg-canvas text-ink-body border-hairline hover:border-muted"
            }`}
            aria-pressed={isActive}
          >
            {db.nameZh || db.name}
          </button>
        );
      })}
    </div>
  );
}
```

Write `components/ModeToggle.tsx`:
```tsx
"use client";
export default function ModeToggle({ mode, onChange }: {
  mode: "code" | "llm";
  onChange: (mode: "code" | "llm") => void;
}) {
  return (
    <div className="inline-flex bg-surface-card rounded-md p-[3px] mb-6" role="radiogroup">
      {(["code", "llm"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`px-5 py-[9px] rounded-sm text-[13px] font-medium transition-colors ${
            mode === m
              ? "bg-canvas text-ink shadow-[0_1px_2px_rgba(20,20,19,0.05)]"
              : "text-muted hover:text-ink-body"
          }`}
          role="radio"
          aria-checked={mode === m}
        >
          {m === "code" ? "代码自动生成" : "LLM 辅助生成"}
        </button>
      ))}
    </div>
  );
}
```

Write `components/QueryPreviewTable.tsx`:
```tsx
"use client";
import { GeneratedQueries } from "@/lib/query-builder/generator";

export default function QueryPreviewTable({ results }: { results: GeneratedQueries[] }) {
  const maxLines = Math.max(...results.map((r) => r.lines.length));

  return (
    <div className="overflow-x-auto border border-hairline rounded-lg" role="region" aria-label="Search query comparison" tabIndex={0}>
      <table className="w-full border-collapse font-mono text-xs leading-relaxed min-w-[900px]">
        <thead className="sticky top-16 z-10">
          <tr>
            <th className="text-left p-3 font-sans text-[11px] font-medium tracking-[1.5px] uppercase text-muted bg-surface-soft border-b border-hairline w-[42px]">#</th>
            <th className="text-left p-3 font-sans text-[11px] font-medium tracking-[1.5px] uppercase text-muted bg-surface-soft border-b border-hairline w-[70px]">概念</th>
            {results.map((r) => (
              <th key={r.database} className="text-left p-3 font-sans text-[11px] font-medium tracking-[1.5px] uppercase text-muted bg-surface-soft border-b border-hairline whitespace-nowrap">{r.database}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxLines }).map((_, i) => (
            <tr key={i} className="hover:bg-[#fdfbf7]">
              <td className="p-3 text-muted border-b border-hairline-soft text-center">#{i + 1}</td>
              <td className="p-3 font-sans text-xs font-medium text-ink-strong border-b border-hairline-soft">{results[0]?.lines[i]?.concept || ""}</td>
              {results.map((r) => (
                <td key={r.database} className="p-3 text-ink-body border-b border-hairline-soft min-w-[240px]">{r.lines[i]?.query || ""}</td>
              ))}
            </tr>
          ))}
          <tr className="bg-surface-card">
            <td className="p-3 text-primary font-semibold border-t border-hairline text-center">Final</td>
            <td className="p-3 font-sans text-xs font-semibold text-ink border-t border-hairline">组合</td>
            {results.map((r) => (
              <td key={r.database} className="p-3 font-medium text-ink border-t border-hairline min-w-[240px]">{r.final}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
```

Write `components/CodeWindow.tsx`:
```tsx
"use client";
import { useState } from "react";

export default function CodeWindow({ title, code, language = "en" }: {
  title: string;
  code: string;
  language?: "en" | "zh";
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split("\n");
  const highlightSyntax = (line: string) => {
    return line
      .replace(/(#\d+)/g, '<span class="text-accent-teal">$1</span>')
      .replace(/\b(AND|OR|NOT|AND NOT)\b/g, '<span class="text-primary">$1</span>')
      .replace(/(\[[a-z:_]+\])/gi, '<span class="text-accent-amber">$1</span>')
      .replace(/(\*|\+|-) /g, '<span class="text-primary">$1</span> ');
  };

  return (
    <div className="bg-surface-dark rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-dark-elevated border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-semantic-error" />
          <div className="w-2.5 h-2.5 rounded-full bg-accent-amber" />
          <div className="w-2.5 h-2.5 rounded-full bg-semantic-success" />
        </div>
        <span className="text-[11px] font-medium tracking-[1.5px] uppercase text-on-dark-soft">{title}</span>
        <button onClick={handleCopy} className="text-[11px] text-on-dark-soft hover:text-on-dark transition-colors">
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="p-6 font-mono text-[13px] leading-[1.9] text-on-dark bg-surface-dark-soft overflow-x-auto">
        {lines.map((line, i) => (
          <div key={i} className="flex">
            <span className="w-8 shrink-0 text-right text-on-dark-soft text-[11px] select-none mr-2">{i + 1}</span>
            <span dangerouslySetInnerHTML={{ __html: highlightSyntax(line) }} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

Write `components/ExportPanel.tsx`:
```tsx
"use client";
import { GeneratedQueries } from "@/lib/query-builder/generator";
import { useState } from "react";

export default function ExportPanel({ results }: { results: GeneratedQueries[] }) {
  const [exporting, setExporting] = useState<string | null>(null);

  const doExport = async (format: string) => {
    setExporting(format);
    try {
      const res = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results }),
      });
      if (!res.ok) throw new Error("Export failed");

      if (format === "json") {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `search-queries.${format}`; a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `search-queries.${format}`; a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setExporting(null);
    }
  };

  const formats = [
    { ext: "xlsx", name: "Excel 工作簿", desc: "带格式表格，概念组着色区分" },
    { ext: "csv", name: "CSV 文本", desc: "逗号分隔，可导入文献管理工具" },
    { ext: "json", name: "JSON 结构化", desc: "含完整元数据，可程序化复用" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {formats.map((f) => (
        <button
          key={f.ext}
          onClick={() => doExport(f.ext)}
          disabled={exporting !== null}
          className="text-center p-10 bg-canvas border border-hairline rounded-lg cursor-pointer transition-colors hover:border-muted hover:shadow-[0_1px_3px_rgba(20,20,19,0.05)] disabled:opacity-50"
        >
          <div className="font-display text-2xl text-ink mb-2">.{f.ext}</div>
          <div className="text-sm font-medium text-ink mb-1">{f.name}</div>
          <div className="text-[13px] text-muted">
            {exporting === f.ext ? "导出中..." : f.desc}
          </div>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Verify TypeScript compilation**

Run:
```bash
cd D:/terms && npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add components/ && git commit -m "feat: add all frontend components (nav, footer, step indicator, concept editor, synonym review, database selector, mode toggle, query table, code window, export panel)"
```

---

### Task 10: Pages

**Files:**
- Create: `app/page.tsx`
- Create: `app/builder/page.tsx`
- Create: `app/settings/page.tsx`

- [ ] **Step 1: Write Home page**

Write `app/page.tsx`:
```tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <section className="text-center py-24 md:py-32 px-6">
        <h1 className="font-display text-[clamp(32px,5vw,48px)] font-semibold leading-[1.1] tracking-[-1px] text-ink mb-4">
          多数据库检索式构建器
        </h1>
        <p className="text-lg font-medium text-ink-strong max-w-[560px] mx-auto mb-8">
          输入关键词，自动匹配同义词，一键生成 PubMed、WOS、CNKI 等 9 大数据库的专业检索式
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/builder" className="btn-primary">开始构建</Link>
          <Link href="/settings" className="btn-secondary">数据库配置</Link>
        </div>
        <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted-soft">
          <span className="inline-block px-2 py-0.5 bg-surface-card border border-hairline rounded-xs font-mono text-[11px] text-muted">Enter</span>
          <span>开始构建 &middot;</span>
          <span className="inline-block px-2 py-0.5 bg-surface-card border border-hairline rounded-xs font-mono text-[11px] text-muted">Ctrl+S</span>
          <span>保存 &middot;</span>
          <span className="inline-block px-2 py-0.5 bg-surface-card border border-hairline rounded-xs font-mono text-[11px] text-muted">Ctrl+E</span>
          <span>导出</span>
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-12 pb-24">
        <h2 className="section-title text-center">支持 9 大数据库</h2>
        <p className="section-sub text-center">每个数据库使用其原生检索语法，严格遵循官方规则</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
          {[
            { name: "PubMed", zh: "MeSH 主题词检索" },
            { name: "Web of Science", zh: "引文索引检索" },
            { name: "Scopus", zh: "多学科摘要数据库" },
            { name: "Embase", zh: "生物医学文献库" },
            { name: "Ovid MEDLINE", zh: "Ovid 平台 MEDLINE" },
            { name: "CNKI", zh: "中国知网" },
            { name: "万方数据", zh: "中文综合数据库" },
            { name: "维普", zh: "中文期刊平台" },
            { name: "Sinomed", zh: "中国生物医学文献库" },
          ].map((db) => (
            <div key={db.name} className="card p-8 hover:border-muted transition-colors">
              <h3 className="font-display text-xl font-semibold text-ink mb-1">{db.name}</h3>
              <p className="text-[13px] text-muted">{db.zh}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-6 md:mx-12 mb-24 bg-primary rounded-lg py-16 px-6 text-center">
        <h2 className="font-display text-[28px] font-semibold leading-[1.2] tracking-[-0.3px] text-white mb-3">
          开始构建你的检索策略
        </h2>
        <p className="text-base text-white/85 mb-6">
          输入研究课题关键词，自动生成多数据库专业检索式
        </p>
        <Link href="/builder" className="inline-flex items-center px-7 py-3 h-11 bg-canvas text-ink rounded-md font-sans text-sm font-medium no-underline active:scale-[0.97] transition-transform">
          创建新项目
        </Link>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Write Builder page (main 5-step workflow)**

Write `app/builder/page.tsx`:
```tsx
"use client";
import { useState } from "react";
import StepIndicator from "@/components/StepIndicator";
import ConceptEditor, { ConceptData } from "@/components/ConceptEditor";
import SynonymReview from "@/components/SynonymReview";
import DatabaseSelector from "@/components/DatabaseSelector";
import ModeToggle from "@/components/ModeToggle";
import QueryPreviewTable from "@/components/QueryPreviewTable";
import CodeWindow from "@/components/CodeWindow";
import ExportPanel from "@/components/ExportPanel";
import { getAllDatabasesWithCustom } from "@/lib/db-config/storage";
import { GeneratedQueries } from "@/lib/query-builder/generator";

export default function BuilderPage() {
  const [step, setStep] = useState(1);
  const [concepts, setConcepts] = useState<ConceptData[]>([]);
  const [synonymMap, setSynonymMap] = useState<Map<string, string[]>>(new Map());
  const [databaseIds, setDatabaseIds] = useState<string[]>(["pubmed", "wos", "scopus", "embase", "ovid_medline", "cnki", "wanfang", "weipu", "sinomed"]);
  const [mode, setMode] = useState<"code" | "llm">("code");
  const [results, setResults] = useState<GeneratedQueries[]>([]);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("");

  const allDbs = getAllDatabasesWithCustom();

  const handleSynonymsConfirmed = (map: Map<string, string[]>) => {
    setSynonymMap(map);
    setStep(3);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      if (mode === "code") {
        const conceptGroups = concepts.map((c) => ({
          name: c.name,
          keywords: c.keywords,
          synonyms: c.keywords.map((kw) => ({
            keyword: kw,
            synonyms: synonymMap.get(kw) || [],
          })),
        }));
        const res = await fetch("/api/generate/code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ concepts: conceptGroups, databaseIds }),
        });
        const data = await res.json();
        setResults(data.results || []);
      } else {
        // LLM mode — generate one DB at a time
        const llmResults: GeneratedQueries[] = [];
        for (const dbId of databaseIds) {
          const res = await fetch("/api/generate/llm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              concepts: concepts.map((c) => ({ name: c.name, terms: c.keywords })),
              topic: topic || concepts.map((c) => c.name).join(", "),
              databaseId: dbId,
              synonymRefs: Object.fromEntries(synonymMap),
            }),
          });
          const data = await res.json();
          if (data.lines) {
            llmResults.push({ database: dbId, lines: data.lines, final: data.final, totalSteps: data.lines.length + 1 });
          }
        }
        setResults(llmResults);
      }
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto">
      <section className="text-center py-16 px-6">
        <h1 className="font-display text-[clamp(28px,4vw,36px)] font-semibold leading-[1.15] tracking-[-0.5px] text-ink mb-2">
          检索式构建器
        </h1>
        <p className="text-base text-muted">5 步完成从关键词到多数据库检索式的生成与导出</p>
      </section>

      <StepIndicator currentStep={step} onStepClick={(s) => { if (s < step) setStep(s); }} />

      <div className="px-6 md:px-12 pb-24">
        {step === 1 && (
          <>
            <h2 className="section-title">概念与关键词</h2>
            <p className="section-sub">定义研究课题的概念分组，每个概念下添加关键词</p>

            <div className="mb-6">
              <label className="block text-[11px] font-medium tracking-[1.5px] uppercase text-muted mb-2">研究课题（可选）</label>
              <input
                className="text-input w-full"
                placeholder="如：ACEI 类药物治疗高血压肾病的临床效果"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <ConceptEditor concepts={concepts} onChange={setConcepts} />

            <div className="text-right mt-8">
              <button
                className="btn-primary"
                disabled={concepts.length === 0 || concepts.every((c) => c.keywords.length === 0)}
                onClick={() => setStep(2)}
              >
                下一步：同义词匹配
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="section-title">同义词匹配</h2>
            <p className="section-sub">系统自动匹配同义词，审核后可增删调整</p>
            <SynonymReview
              keywords={concepts.flatMap((c) => c.keywords.map((kw) => ({ term: kw, concept: c.name })))}
              language="en"
              onConfirmed={handleSynonymsConfirmed}
            />
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="section-title">数据库与生成模式</h2>
            <p className="section-sub">选择目标数据库和生成方式</p>

            <ModeToggle mode={mode} onChange={setMode} />

            <div className="card mb-8">
              <p className="text-[11px] font-medium tracking-[1.5px] uppercase text-muted mb-3">
                目标数据库 <span className="font-normal normal-case tracking-normal">({databaseIds.length}/9 选中)</span>
              </p>
              <DatabaseSelector
                databases={allDbs}
                selected={databaseIds}
                onToggle={(id) => setDatabaseIds((prev) =>
                  prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                )}
              />
            </div>

            <div className="text-right">
              <button
                className="btn-primary"
                disabled={databaseIds.length === 0 || loading}
                onClick={handleGenerate}
              >
                {loading ? "生成中..." : "生成检索式"}
              </button>
            </div>
          </>
        )}

        {step >= 4 && results.length > 0 && (
          <>
            <h2 className="section-title mt-12">检索式预览</h2>
            <p className="section-sub">多数据库检索式对比表，横向滚动查看各数据库语法差异</p>
            <QueryPreviewTable results={results} />

            <div className="flex justify-end gap-3 mt-4">
              <button className="btn-secondary btn-sm" onClick={() => setStep(3)}>返回调整</button>
              <button className="btn-primary btn-sm" onClick={() => setStep(5)}>确认，准备导出</button>
            </div>

            <div className="mt-16">
              <h2 className="section-title">检索式代码视图</h2>
              <p className="section-sub">单数据库完整检索式，支持复制</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.slice(0, 4).map((r) => (
                  <CodeWindow
                    key={r.database}
                    title={`${r.database}`}
                    code={r.lines.map((l) => `#${l.step} ${l.query}`).join("\n\n") + `\n\n${r.final}`}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {step >= 5 && (
          <>
            <h2 className="section-title mt-16">导出检索策略</h2>
            <p className="section-sub">支持 Excel、CSV、JSON 三种格式</p>
            <ExportPanel results={results} />
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write Settings page**

Write `app/settings/page.tsx`:
```tsx
"use client";
import { useState } from "react";
import { getAllDatabasesWithCustom } from "@/lib/db-config/storage";

export default function SettingsPage() {
  const databases = getAllDatabasesWithCustom();

  return (
    <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-24">
      <h1 className="font-display text-[clamp(28px,4vw,36px)] font-semibold leading-[1.15] tracking-[-0.5px] text-ink mb-2">
        数据库配置管理
      </h1>
      <p className="text-base text-muted mb-12">查看、编辑内置数据库检索语法，或添加自定义数据库</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {databases.map((db) => (
          <div key={db.id} className="card p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-semibold text-ink">{db.name}</h3>
              <span className="px-3 py-1 rounded-pill text-[11px] font-medium bg-surface-card text-muted">
                {db.language === "en" ? "English" : "中文"}
              </span>
            </div>
            <div className="space-y-2 text-[13px]">
              <div className="flex gap-2">
                <span className="text-muted shrink-0">运算符:</span>
                <span className="font-mono text-ink-body">
                  AND=&quot;{db.operators.and}&quot; OR=&quot;{db.operators.or}&quot; NOT=&quot;{db.operators.not}&quot;
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted shrink-0">字段限定:</span>
                <span className="font-mono text-ink-body">{db.fieldQualifier}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted shrink-0">截词:</span>
                <span className="font-mono text-ink-body">{db.truncation.right || "不支持"}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted shrink-0">邻近检索:</span>
                <span className="font-mono text-ink-body">{db.proximity?.syntax || "不支持"}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted shrink-0">行号格式:</span>
                <span className="font-mono text-ink-body">{db.lineNumberFormat}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <button className="btn-secondary">+ 添加自定义数据库</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript compilation**

Run:
```bash
cd D:/terms && npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/builder app/settings && git commit -m "feat: add home, builder, and settings pages"
```

---

### Task 11: Integration Testing & Polish

- [ ] **Step 1: Start dev server and verify all pages render**

Run:
```bash
cd D:/terms && npm run dev
```
Expected: 
- Home page at http://localhost:3000 — hero + CTA + database grid
- Builder at http://localhost:3000/builder — 5-step interactive workflow
- Settings at http://localhost:3000/settings — database config grid
- API endpoints return proper JSON

- [ ] **Step 2: Test synonym lookup API**

Run (in a separate terminal):
```bash
curl "http://localhost:3000/api/synonyms/lookup?term=hypertension&lang=en"
```
Expected: JSON with standardTerm, synonyms array, source, confidence.

- [ ] **Step 3: Test code generation API**

Run:
```bash
curl -X POST http://localhost:3000/api/generate/code \
  -H "Content-Type: application/json" \
  -d '{"concepts":[{"name":"Disease","keywords":["hypertension"],"synonyms":[{"keyword":"hypertension","synonyms":["high blood pressure","HTN"]}]}],"databaseIds":["pubmed","wos"]}'
```
Expected: JSON with 2 GeneratedQueries, each with correct db-specific syntax.

- [ ] **Step 4: Test export API**

Run:
```bash
curl -X POST http://localhost:3000/api/export/csv \
  -H "Content-Type: application/json" \
  -d '{"results":[{"database":"pubmed","lines":[{"step":1,"concept":"Disease","query":"hypertension[tiab] OR \"high blood pressure\"[tiab]","fieldUsed":"Title/Abstract"}],"final":"#1","totalSteps":2}]}'
```
Expected: CSV download.

- [ ] **Step 5: Fix any issues found during testing**

- [ ] **Step 6: Commit final fixes**

```bash
git add -A && git commit -m "fix: integration test fixes and polish"
```
