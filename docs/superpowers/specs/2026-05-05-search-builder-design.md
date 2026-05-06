# 关键词多数据库检索式生成器 — 设计规格

## 目标

构建一个 Web App，输入研究关键词后自动匹配同义词，一键生成 PubMed、WOS、Scopus、Embase、Ovid MEDLINE、CNKI、万方、维普、Sinomed 9 大数据库的专业检索式，支持 Excel/CSV/JSON 导出。

## 技术栈

- **Next.js** (App Router) 全栈方案
- **React** + **TypeScript** 前后端统一语言
- **Tailwind CSS** 样式（token 按 design.md 定制）
- **exceljs** / **papaparse** 文件导出
- 部署：Vercel（免费）或 Docker 自托管

## 架构

```
terms/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # 首页 — 课题入口
│   ├── builder/page.tsx          # 检索式构建主页面
│   ├── settings/page.tsx         # 数据库配置管理
│   ├── api/
│   │   ├── synonyms/[db]/route.ts   # 同义词查询代理
│   │   ├── generate/code/route.ts   # Mode 1: 代码生成
│   │   ├── generate/llm/route.ts    # Mode 2: LLM 生成
│   │   └── export/[fmt]/route.ts    # 导出 Excel/CSV/JSON
├── lib/
│   ├── db-config/                # 9个数据库完整配置
│   ├── synonyms/                 # 同义词引擎 (MeSH/Sinomed/缓存)
│   ├── query-builder/            # 检索式生成核心
│   ├── llm/                      # GLM-5 客户端 + 提示词模板
│   └── export/                   # 文件生成
├── components/                   # React 组件
└── data/builtin-thesauri/        # 内置权威词库 YAML
```

## 工作流 (5 Steps)

1. **概念与关键词** — 用户输入研究课题，定义概念分组，每个概念添加关键词
2. **同义词匹配** — 引擎自动匹配（MeSH→Sinomed→自定义），用户审核增删
3. **数据库与模式** — 选择目标数据库，切换 Mode 1(代码) / Mode 2(LLM)
4. **检索式预览** — 多数据库检索式对比表，每列一个数据库，横向滚动
5. **导出** — Excel (.xlsx) / CSV (.csv) / JSON (.json)

## 数据库检索语法配置 (已验证)

9 个数据库各有一套完整配置对象，涵盖：运算符、字段标识、引号规则、截词符、通配符、邻近检索语法、行号格式。

关键差异详见此前对话中的完整语法表。

## 同义词引擎

三层架构：
1. **基准词库** — PubMed MeSH (英文) + Sinomed 主题词 (中文)，YAML 离线内置
2. **实时查询** — NCBI E-utilities API，结果写缓存
3. **用户自定义** — Web UI 编辑/导入

匹配流程：缓存查找 → 内置词库精确匹配 → API 实时查询 → 编辑距离模糊匹配（用户确认）

## Mode 2: LLM 辅助生成

- API: `https://api.z.ai/api/anthropic` (Anthropic 协议)
- Model: `glm-5`
- System Prompt: 资深医学图书馆员角色 + 目标数据库完整语法规则 + JSON 输出格式
- User Message: 概念关键词 JSON + MeSH/Sinomed 同义词参考 + 检索要求
- 输出校验: 语法规则校验 → 括号配对校验 → 截词符位置校验 → 失败自动重试(最多2次)

## UI 设计系统

遵循 design.md 的 Anthropic editorial 风格：
- **色彩**: canvas `#faf9f5`, primary coral `#cc785c`, surface-dark `#181715`, ink `#141413`
- **字体**: Cormorant Garamond (display) + Inter (body) + JetBrains Mono (code)
- **圆角**: md(8px) 按钮, lg(12px) 卡片, pill 标签
- **间距**: 4px 基准体系 (4-96px)
- **动效**: 120-280ms, ease-out/ease-spring, 支持 reduced-motion
- **组件**: 参考 v3 mockup (builder-v3.html)

## 注意事项

- LLM API key 仅存放于服务端环境变量，不可暴露至前端
- 表格列头与内容对齐问题在实现时注意处理
- 中文数据库 (CNKI/万方/维普/Sinomed) 同义词以 Sinomed 主题词表为基准
- 不支持邻近检索的数据库（PubMed）不能输出 NEAR/ADJ 语法
