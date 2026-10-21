"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LOCALES } from "@/lib/i18n/locales";
import { useI18n } from "@/components/i18n/LocaleProvider";

export function LanguageMenu() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = LOCALES.find((item) => item.id === locale) ?? LOCALES[0];

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${t.language.menu} ${current.label}`}
        onClick={() => setOpen((value) => !value)}
        className="rounded-full border border-[#1F2937] bg-[#111827] px-4 py-2 text-base font-semibold text-[#E6EDF3] transition hover:border-[#4ADE80]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4ADE80]"
      >
        {current.label}
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t.language.menu}
          className="absolute right-0 z-[80] mt-2 max-h-[70vh] w-52 overflow-auto rounded-2xl border border-[#1F2937] bg-[#0B0F14] p-2 shadow-2xl"
        >
          {LOCALES.map((item) => {
            const selected = item.id === locale;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  lang={item.htmlLang}
                  onClick={() => {
                    setLocale(item.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-base ${
                    selected ? "bg-[#4ADE80] font-bold text-[#0B0F14]" : "text-[#E6EDF3] hover:bg-[#111827]"
                  }`}
                >
                  <span>{item.label}</span>
                  {selected ? <span aria-hidden>✓</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function SkipLink() {
  const { t } = useI18n();
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-[#4ADE80] focus:px-4 focus:py-2 focus:font-bold focus:text-[#0B0F14]"
    >
      {t.skip}
    </a>
  );
}
