import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SearchBuilder — 多数据库检索式生成器",
  description:
    "输入关键词，自动匹配同义词，一键生成多数据库专业检索式",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col">
        <nav className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 md:px-12 bg-canvas/90 backdrop-blur-sm border-b border-hairline">
          <a href="/" className="flex items-center gap-1.5 font-display text-xl tracking-[-0.3px] text-ink no-underline">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="shrink-0">
              <circle cx="7" cy="7" r="1.8" fill="currentColor" />
              <line x1="7" y1="0" x2="7" y2="5.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="7" y1="8.8" x2="7" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="0" y1="7" x2="5.2" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="8.8" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            SearchBuilder
          </a>
          <div className="hidden md:flex gap-8">
            <a href="/builder" className="text-sm font-medium pb-0.5 border-b-2 border-primary text-ink no-underline">构建器</a>
            <a href="/settings" className="text-sm font-medium pb-0.5 border-b-2 border-transparent text-muted hover:text-ink no-underline">数据库配置</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="/builder" className="btn-primary btn-sm text-xs no-underline">新建项目</a>
          </div>
        </nav>
        <main className="flex-1">{children}</main>
        <footer className="bg-surface-dark text-on-dark-soft text-sm py-16 px-12">
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { title: "英文数据库", links: ["PubMed", "Web of Science", "Scopus", "Embase", "Ovid MEDLINE"] },
              { title: "中文数据库", links: ["CNKI", "万方数据", "维普", "Sinomed"] },
              { title: "功能", links: ["自动同义词匹配", "LLM 辅助生成", "数据库配置管理"] },
              { title: "关于", links: ["使用说明", "数据库语法参考"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-[11px] font-medium tracking-[1.5px] uppercase text-on-dark mb-4">{col.title}</h4>
                {col.links.map((l) => (
                  <span key={l} className="block leading-loose cursor-pointer hover:text-on-dark transition-colors">{l}</span>
                ))}
              </div>
            ))}
          </div>
        </footer>
      </body>
    </html>
  );
}
