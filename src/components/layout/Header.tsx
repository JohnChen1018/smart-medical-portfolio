"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { LanguageMenu } from "@/components/i18n/LanguageMenu";
import { useI18n } from "@/components/i18n/LocaleProvider";

export function Header() {
  const pathname = usePathname();
  const { t } = useI18n();
  const headerRef = useRef<HTMLElement>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [viewerName, setViewerName] = useState("");
  const [canAdmin, setCanAdmin] = useState(false);
  const [confirmSwitch, setConfirmSwitch] = useState(false);

  useEffect(() => {
    const syncRole = () => {
      const nextRole = window.localStorage.getItem("medical-portfolio-role");
      setHasEntered(Boolean(nextRole));
      setRole(nextRole);
      setViewerName(
        nextRole === "guest" ? window.localStorage.getItem("medical-portfolio-guest-name") || "" : "",
      );
    };

    const refreshSession = () => {
      syncRole();
      fetch("/api/portal/session", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => setCanAdmin(Boolean(d.authenticated && d.canAccessAdmin)))
        .catch(() => setCanAdmin(false));
    };

    refreshSession();
    window.addEventListener("medical-portfolio-role-change", refreshSession);
    window.addEventListener("storage", refreshSession);

    return () => {
      window.removeEventListener("medical-portfolio-role-change", refreshSession);
      window.removeEventListener("storage", refreshSession);
    };
  }, [pathname]);

  useEffect(() => {
    if (!confirmSwitch) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setConfirmSwitch(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmSwitch]);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const apply = () => {
      document.documentElement.style.setProperty("--site-header-h", `${el.offsetHeight}px`);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--site-header-h");
    };
  }, [pathname, hasEntered, canAdmin]);

  if (pathname?.startsWith("/jasladmin") || pathname?.startsWith("/admin")) {
    return null;
  }

  const showNavigation = pathname !== "/" || hasEntered;
  const resetIdentity = async () => {
    const guestId = window.localStorage.getItem("medical-portfolio-guest-id");
    await fetch("/api/portal/logout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId }),
    }).catch(() => null);
    window.localStorage.removeItem("medical-portfolio-role");
    window.localStorage.removeItem("medical-portfolio-guest-id");
    window.localStorage.removeItem("medical-portfolio-guest-name");
    window.dispatchEvent(new Event("medical-portfolio-role-change"));
    window.location.href = "/";
  };

  const wsiFullBleed = pathname?.includes("whole-slide-object-detection");

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 w-full border-b border-[#1F2937] bg-[#0B0F14]"
    >
      <div
        className={`flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6 ${
          wsiFullBleed ? "max-w-none" : "mx-auto max-w-7xl"
        }`}
      >
        <Link href="/" className="flex min-h-11 items-center gap-2">
          <span className="text-[#4ADE80] text-xl">AI</span>
          <h2 className="text-base font-semibold tracking-tight text-[#E6EDF3]">
            {t.brand}
          </h2>
        </Link>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {showNavigation && (
            <>
            <nav className="flex items-center gap-1">
              {[
                { href: "/projects", label: t.nav.projects },
                { href: "/about", label: t.nav.about },
              ].map((item) => {
                const on = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-4 py-2 text-base font-semibold transition-colors ${
                      on ? "bg-[#111827] text-[#4ADE80]" : "text-[#BFD2EA] hover:bg-[#111827] hover:text-[#4ADE80]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            {canAdmin && (
              <a
                href="/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-[#4ADE80]/40 bg-[#4ADE80]/10 px-3 py-1.5 text-sm font-bold text-[#4ADE80] transition hover:bg-[#4ADE80]/20"
              >
                {t.nav.admin}
              </a>
            )}
            {viewerName ? <span className="text-base text-[#BFD2EA]">{viewerName}</span> : null}
            {role === "user" && canAdmin ? <span className="text-base text-[#4ADE80]">{t.nav.adminRole}</span> : null}
            <Button variant="outline" size="sm" onClick={() => setConfirmSwitch(true)}>
              {t.nav.switchViewer}
            </Button>
            </>
          )}
          <LanguageMenu />
        </div>
      </div>
      {confirmSwitch
        ? createPortal(
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-6"
              role="presentation"
              onClick={() => setConfirmSwitch(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="switch-viewer-title"
                className="w-full max-w-md rounded-3xl border border-[#1F2937] bg-[#0B0F14] p-7"
                onClick={(event) => event.stopPropagation()}
              >
                <h2 id="switch-viewer-title" className="text-2xl font-black text-[#E6EDF3]">{t.nav.switchAsk}</h2>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setConfirmSwitch(false)} className="rounded-2xl border border-[#1F2937] py-3 text-[#9CA3AF]">
                    {t.home.cancel}
                  </button>
                  <button type="button" onClick={() => void resetIdentity()} className="rounded-2xl bg-[#4ADE80] py-3 font-bold text-[#0B0F14]">
                    {t.nav.switchViewer}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </header>
  );
}
