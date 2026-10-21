"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n/LocaleProvider";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const { t } = useI18n();

  if (pathname?.startsWith("/jasladmin") || pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="mt-auto w-full bg-[#0D1117]">
      <div className="w-full border-t border-[#1F2937]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-[#4ADE80] text-sm">AI</span>
            <span className="text-[#9CA3AF] text-xs">{t.brand}</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/projects" className="text-[#9CA3AF] hover:text-[#4ADE80] transition-colors">
              {t.nav.projects}
            </Link>
            <Link href="/about" className="text-[#9CA3AF] hover:text-[#4ADE80] transition-colors">
              {t.nav.about}
            </Link>
          </div>
          <p className="text-[#6B7280] text-xs">© {currentYear} 智慧醫療作品集</p>
        </div>
      </div>
    </footer>
  );
}
