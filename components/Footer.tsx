const FOOTER_COLUMNS = [
  {
    title: "英文数据库",
    links: ["PubMed", "Web of Science", "Scopus", "Embase", "Ovid MEDLINE"],
  },
  {
    title: "中文数据库",
    links: ["CNKI (中国知网)", "万方数据", "维普 (VIP)", "Sinomed"],
  },
  {
    title: "功能",
    links: ["自动同义词匹配", "LLM 辅助生成", "数据库配置管理", "多格式导出"],
  },
  {
    title: "关于",
    links: ["使用说明", "数据库语法参考", "MeSH 词表", "检索策略指南"],
  },
];

export default function Footer() {
  return (
    <footer className="bg-surface-dark text-on-dark-soft text-sm py-16 px-6 md:px-12">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="text-[11px] font-medium tracking-[1.5px] uppercase text-on-dark mb-4">
              {col.title}
            </h4>
            {col.links.map((link) => (
              <span
                key={link}
                className="block leading-loose cursor-pointer hover:text-on-dark transition-colors"
              >
                {link}
              </span>
            ))}
          </div>
        ))}
      </div>

      <div className="max-w-[1200px] mx-auto mt-12 pt-8 border-t border-surface-dark-soft text-xs text-on-dark-soft">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} SearchBuilder. All rights reserved.</span>
          <span>多数据库检索式生成工具 · 支持 9 大中英文生物医学数据库</span>
        </div>
      </div>
    </footer>
  );
}
