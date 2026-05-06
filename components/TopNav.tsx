"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopNav() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "首页" },
    { href: "/builder", label: "构建器" },
    { href: "/settings", label: "数据库配置" },
  ];

  return (
    <nav className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 md:px-12 bg-canvas/90 backdrop-blur-sm border-b border-hairline">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-1.5 font-display text-xl tracking-[-0.3px] text-ink no-underline hover:text-primary transition-colors"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          aria-hidden="true"
          className="shrink-0"
        >
          <circle cx="7" cy="7" r="1.8" fill="currentColor" />
          <line
            x1="7"
            y1="0"
            x2="7"
            y2="5.2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="7"
            y1="8.8"
            x2="7"
            y2="14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="0"
            y1="7"
            x2="5.2"
            y2="7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="8.8"
            y1="7"
            x2="14"
            y2="7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        SearchBuilder
      </Link>

      {/* Nav links */}
      <div className="hidden md:flex gap-8">
        {links.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium pb-0.5 border-b-2 no-underline transition-colors ${
                isActive
                  ? "border-primary text-ink"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* CTA */}
      <div className="flex items-center gap-3">
        <Link href="/builder" className="btn-primary btn-sm text-xs no-underline">
          新建项目
        </Link>
      </div>
    </nav>
  );
}
