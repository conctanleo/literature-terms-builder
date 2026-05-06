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
          <kbd className="inline-block px-2 py-0.5 bg-surface-card border border-hairline rounded-xs font-mono text-[11px] text-muted">Enter</kbd>
          <span>开始构建 &middot;</span>
          <kbd className="inline-block px-2 py-0.5 bg-surface-card border border-hairline rounded-xs font-mono text-[11px] text-muted">Ctrl+S</kbd>
          <span>保存 &middot;</span>
          <kbd className="inline-block px-2 py-0.5 bg-surface-card border border-hairline rounded-xs font-mono text-[11px] text-muted">Ctrl+E</kbd>
          <span>导出</span>
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-6 md:px-12 pb-24">
        <h2 className="section-title text-center">支持 9 大数据库</h2>
        <p className="section-sub text-center">每个数据库使用其原生检索语法，严格遵循官方规则</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
            <div key={db.name} className="card hover:border-muted transition-colors cursor-default">
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
