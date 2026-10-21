"use client";

import { useEffect, useRef, useState } from "react";
import { FaChevronLeft } from "react-icons/fa";
import type { ProjectWithDashboard } from "@/lib/wsiCms";
import { wsiUi } from "@/lib/wsiUiLabels";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { isStepKey } from "@/lib/i18n/copy";
import { GdriveExperimentsProvider } from "@/components/projects/wsi/GdriveExperimentsContext";
import { ApplicationTab } from "@/components/projects/wsi/ApplicationTab";
import { DataTab } from "@/components/projects/wsi/DataTab";
import { ModelingTab } from "@/components/projects/wsi/modeling/ModelingTab";
import { SimulationTab } from "@/components/projects/wsi/SimulationTab";
import { AnalysisTab } from "@/components/projects/wsi/AnalysisTab";

const tabs = [
  { key: "application", label: wsiUi.tabs.application },
  { key: "data", label: wsiUi.tabs.data },
  { key: "modeling", label: wsiUi.tabs.modeling },
  { key: "simulation", label: wsiUi.tabs.simulation },
  { key: "analysis", label: wsiUi.tabs.analysis },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export function WorkflowDashboard({
  title,
  backHref,
  project,
}: {
  title: string;
  backHref: string;
  project?: ProjectWithDashboard | null;
}) {
  const [active, setActive] = useState<TabKey>("application");
  const navRef = useRef<HTMLElement>(null);
  const skipTabSave = useRef(true);
  const [fontScale, setFontScale] = useState(1.05);
  const [readingMode, setReadingMode] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    try {
      const savedTab = sessionStorage.getItem("wsi-tab");
      if (savedTab && tabs.some((tab) => tab.key === savedTab)) setActive(savedTab as TabKey);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (skipTabSave.current) {
      skipTabSave.current = false;
      return;
    }
    try {
      sessionStorage.setItem("wsi-tab", active);
    } catch {
      /* ignore */
    }
  }, [active]);

  useEffect(() => {
    const list = navRef.current?.querySelector<HTMLElement>('[role="tablist"]');
    const current = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!list || !current || list.scrollWidth <= list.clientWidth) return;
    const left = current.offsetLeft - list.clientWidth / 2 + current.offsetWidth / 2;
    list.scrollTo({ left: Math.max(0, left) });
  }, [active]);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const apply = () => {
      document.documentElement.style.setProperty("--wsi-nav-h", `${el.offsetHeight}px`);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--wsi-nav-h");
    };
  }, [active, readingMode, fontScale]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wsi-font-scale");
      if (saved) {
        const n = Number(saved);
        if (Number.isFinite(n) && n >= 0.8 && n <= 1.8) setFontScale(n);
      }
      if (localStorage.getItem("wsi-reading-mode") === "1") setReadingMode(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("wsi-font-scale", String(fontScale));
      localStorage.setItem("wsi-reading-mode", readingMode ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [fontScale, readingMode]);

  const effectiveScale = readingMode ? Math.max(fontScale, 1.2) : fontScale;

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const shell = document.querySelector("div.flex.min-h-screen");
    root.style.removeProperty("zoom");
    body.style.removeProperty("zoom");
    if (shell instanceof HTMLElement) shell.style.zoom = String(effectiveScale);
    return () => {
      body.style.removeProperty("zoom");
      if (shell instanceof HTMLElement) shell.style.removeProperty("zoom");
    };
  }, [effectiveScale]);

  return (
    <div className="wsi-dashboard min-h-screen bg-[#0B0F14] text-[#E6EDF3]">
      <nav
        ref={navRef}
        className="sticky z-40 border-b border-[#1F2937] bg-[#0B0F14] px-4 py-3 sm:px-6"
        style={{ top: "var(--site-header-h, 4rem)" }}
      >
        <div className="mx-auto flex w-full max-w-none flex-wrap items-center gap-2">
          <a
            href={backHref}
            className="relative z-10 flex shrink-0 items-center gap-2 rounded-full border border-[#1F2937] bg-[#111827] px-4 py-2 text-base font-semibold text-[#E6EDF3] transition hover:border-[#4ADE80]/50"
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
              event.preventDefault();
              window.location.assign(backHref);
            }}
          >
            <FaChevronLeft className="text-xs" />
            {t.detail.back}
          </a>
          <h1 className="sr-only shrink-0 text-base font-black text-[#E6EDF3] xl:not-sr-only xl:block">{title}</h1>
          <div className="order-last flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto sm:min-w-0 sm:flex-1" role="tablist">
            {tabs.map((tab, index) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active === tab.key}
                onClick={() => setActive(tab.key)}
                className={`shrink-0 rounded-full px-2.5 py-1.5 text-sm font-semibold sm:px-4 sm:py-2 sm:text-base transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4ADE80] ${active === tab.key ? "bg-[#8B5CF6] text-white" : "bg-[#111827] text-[#BFD2EA] hover:text-[#E6EDF3]"}`}
              >
                {index + 1}. {isStepKey(tab.key) ? t.steps[tab.key].label : tab.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2 text-sm text-[#9CA3AF] sm:ml-0">
            <button
              type="button"
              onClick={() => setReadingMode((v) => !v)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                readingMode
                  ? "border-transparent bg-[#22D3EE] font-bold text-[#0B0F14]"
                  : "border-[#1F2937] bg-[#111827] text-[#9CA3AF] hover:text-[#E6EDF3]"
              }`}
            >
              {readingMode ? t.wsi.readingOn : t.wsi.reading}
            </button>
            <div className="flex items-center overflow-hidden rounded-lg border border-[#1F2937] bg-[#111827]">
              <button
                type="button"
                aria-label={t.wsi.zoomOut}
                title={t.wsi.zoomOut}
                onClick={() => setFontScale((s) => Math.max(0.8, Number((s - 0.1).toFixed(2))))}
                className="px-2.5 py-1.5 font-bold text-[#9CA3AF] transition hover:bg-[#1F2937] hover:text-[#E6EDF3]"
              >
                A−
              </button>
              <button
                type="button"
                aria-label={t.wsi.zoomReset}
                title={t.wsi.zoomReset}
                onClick={() => {
                  setFontScale(1.05);
                  setReadingMode(false);
                }}
                className="border-x border-[#1F2937] px-2 py-1.5 font-mono text-xs text-[#9CA3AF] transition hover:bg-[#1F2937] hover:text-[#E6EDF3]"
              >
                {Math.round(effectiveScale * 100)}%
              </button>
              <button
                type="button"
                aria-label={t.wsi.zoomIn}
                title={t.wsi.zoomIn}
                onClick={() => setFontScale((s) => Math.min(1.8, Number((s + 0.1).toFixed(2))))}
                className="px-2.5 py-1.5 font-bold text-[#9CA3AF] transition hover:bg-[#1F2937] hover:text-[#E6EDF3]"
              >
                A+
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto w-full max-w-none px-4 py-4 sm:px-6 lg:px-10">
        <GdriveExperimentsProvider>
          {active === "application" && <ApplicationTab project={project} />}
          {active === "data" && <DataTab />}
          {active === "modeling" && <ModelingTab />}
          {active === "simulation" && <SimulationTab />}
          {active === "analysis" && <AnalysisTab />}
        </GdriveExperimentsProvider>
      </main>
    </div>
  );
}
