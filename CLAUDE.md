# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

SearchBuilder — a multi-database academic search query builder for systematic reviews and medical literature searches. Users enter research concepts with keywords; the system finds bilingual (Chinese/English) synonyms and generates database-specific search queries for 9 databases (PubMed, WOS, Scopus, Embase, Ovid MEDLINE, CNKI, 万方, 维普, Sinomed).

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint
```

No test suite exists yet.

## Architecture

Next.js 14 App Router, TypeScript, Tailwind CSS. Client-only SPA — no server-side data store. State and config persist via `localStorage` in the browser.

### Key workflow (builder)

The main builder page (`app/builder/page.tsx`) is a 5-step wizard:

1. **Concepts & keywords** — `ConceptEditor` collects concept groups, each with multiple keywords
2. **Synonym matching** — `SynonymReview` calls `/api/synonyms/lookup` for each keyword, displays bilingual synonym results with toggles and manual add
3. **Database + mode selection** — pick which databases to generate for, toggle "code" vs "LLM" mode
4. **Results preview** — `QueryPreviewTable` shows per-database comparison, `CodeWindow` shows individual queries with copy
5. **Export** — `ExportPanel` downloads Excel/CSV/JSON via `/api/export/[format]`

### Synonym engine (`lib/synonyms/engine.ts`)

CJK character detection determines primary language, then runs parallel ZH and EN lookups. Each lookup follows a cascade:

**English**: built-in MeSH JSON → PubMed E-utilities API → (if ZH original, translate via built-in map then retry MeSH+API) → fuzzy Levenshtein match → LLM fallback

**Chinese**: built-in Sinomed JSON → (if EN original, translate via built-in map and retry Sinomed) → fuzzy match → LLM fallback

Results are cached in-memory + `localStorage` keyed "synonym-cache-v2".

### Query generation

Two modes controlled by `ModeToggle`:

- **Code mode** (`/api/generate/code`): Template-based. Groups databases by language (EN/ZH), assigns corresponding-language synonyms to each group, then `query-builder/formatter.ts` applies per-database syntax rules (field qualifiers, quoting, truncation, operators).
- **LLM mode** (`/api/generate/llm`): Sends database-specific system prompts and user concept lists to an OpenAI-compatible LLM. Response is validated post-hoc by `llm/validator.ts` for syntax correctness, with up to 2 retries on validation failure.

### Database config registry (`lib/db-config/`)

`types.ts` defines the `DatabaseConfig` shape. `registry.ts` holds 9 built-in databases with full syntax rules (operators, field qualifier style, quoting, truncation, wildcards, proximity, line number format). `storage.ts` layers custom databases from localStorage on top.

Key field qualifier styles: `[]` (PubMed, Sinomed), `=` (WOS, CNKI, VIP), `()` (Scopus), `:` (Embase, 万方), `.` (Ovid MEDLINE).

### LLM integration

Server-side client (`lib/llm/client.ts`) uses server env vars (`GLM5_API_KEY`, `GLM5_BASE_URL`). Client-side synonym lookup and translation use browser localStorage config, passed as request body to API routes. The API protocol is OpenAI-compatible (`/v1/chat/completions`, `Authorization: Bearer` auth).

### Design system

From `DESIGN.md`: Anthropic brand-inspired palette — cream canvas (`#faf9f5`), coral primary (`#cc785c`), dark navy surfaces (`#181715`). Serif display font stack for headings (Copernicus/Tiempos Headline), humanist sans for body (StyreneB/Inter). All custom CSS utility classes in `app/globals.css`.

## Environment

Required env var for server-side LLM calls: `GLM5_API_KEY`. Optional: `GLM5_BASE_URL` (defaults to `https://open.bigmodel.cn/api/paas/v4`), `GLM5_MODEL` (defaults to `glm-5.1`).

LLM config for client-side features (synonym lookup, translation) is set in the Settings page and stored in localStorage keys: `llm-apiKey`, `llm-baseUrl`, `llm-model`.
