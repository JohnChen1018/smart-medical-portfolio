"use client";

import { useMemo, useState } from "react";
import { FaChevronDown, FaChevronLeft, FaExternalLinkAlt } from "react-icons/fa";
import {
  metricGlossary,
  metricGlossaryCore,
  metricGlossaryExtra,
} from "@/lib/wsiDashboard";
import { wsiUi } from "@/lib/wsiUiLabels";

export function MetricGlossaryPage({
  onBack,
  backLabel,
}: {
  onBack: () => void;
  backLabel?: string;
}) {
  const allKeys = useMemo(
    () => [...metricGlossaryCore, ...metricGlossaryExtra].map((m) => m.key),
    [],
  );
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
  const [showExtra, setShowExtra] = useState(false);

  const toggle = (key: string) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => setOpenKeys(new Set(allKeys));
  const collapseAll = () => setOpenKeys(new Set());

  const renderMetric = (m: (typeof metricGlossary)[number]) => {
    const open = openKeys.has(m.key);
    return (
      <article key={m.key} className="overflow-hidden rounded-2xl border border-[#1F2937] bg-[#111827]">
        <button
          type="button"
          onClick={() => toggle(m.key)}
          className="flex w-full items-start justify-between gap-3 p-5 text-left transition hover:bg-[#0F172A]/60"
        >
          <div>
            <div className="text-xl font-black text-[#C4B5FD]">{m.name}</div>
            {!open && <p className="mt-2 line-clamp-2 text-base leading-7 text-[#9CA3AF]">{m.what}</p>}
          </div>
          <FaChevronDown
            className={`mt-1 shrink-0 text-sm text-[#6B7280] transition ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <div className="border-t border-[#1F2937] px-5 pb-5 pt-4">
            <p className="text-base leading-8 text-[#E6EDF3]">{m.what}</p>
            {m.formula && (
              <div className="mt-4 rounded-lg border border-[#22D3EE]/30 bg-[#0F172A] px-4 py-3">
                <div className="text-xs uppercase tracking-widest text-[#6B7280]">
                  {wsiUi.simulation.formulaLabel}
                </div>
                {m.formulaUrl ? (
                  <a
                    href={m.formulaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block font-mono text-base text-[#22D3EE] hover:underline"
                  >
                    {m.formula}
                    <span className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[#9CA3AF]">
                      <FaExternalLinkAlt className="text-[10px]" />
                      {m.formulaSource ?? "查看出處論文"}
                    </span>
                  </a>
                ) : (
                  <code className="mt-2 block font-mono text-base text-[#22D3EE]">{m.formula}</code>
                )}
              </div>
            )}
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="text-base leading-relaxed">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 text-base text-[#9CA3AF] transition hover:text-[#E6EDF3]"
      >
        <FaChevronLeft className="text-xs" />
        {backLabel ?? wsiUi.analysis.backToAnalysis}
      </button>
      <h1 className="mb-2 text-3xl font-black text-[#E6EDF3] md:text-4xl">{wsiUi.analysis.metricsBtn}</h1>
      <p className="mb-6 text-base text-[#9CA3AF]">{wsiUi.analysis.metricsCoreTitle}</p>
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={expandAll}
          className="rounded-lg border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 px-4 py-2 text-sm font-semibold text-[#C4B5FD] transition hover:bg-[#8B5CF6]/20"
        >
          全部展開
        </button>
        <button
          type="button"
          onClick={collapseAll}
          className="rounded-lg border border-[#1F2937] bg-[#111827] px-4 py-2 text-sm font-semibold text-[#9CA3AF] transition hover:text-[#E6EDF3]"
        >
          全部收合
        </button>
      </div>
      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
        <div className="space-y-3">
          {metricGlossaryCore.filter((_, i) => i % 2 === 0).map(renderMetric)}
        </div>
        <div className="space-y-3">
          {metricGlossaryCore.filter((_, i) => i % 2 === 1).map(renderMetric)}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setShowExtra((v) => !v)}
        className="mt-8 rounded-xl border border-[#1F2937] bg-[#111827] px-4 py-3 text-base font-semibold text-[#C4B5FD] transition hover:border-[#8B5CF6]/40"
      >
        {showExtra ? "收合補充" : `＋ ${wsiUi.analysis.metricsExtraTitle}`}
      </button>
      {showExtra && (
        <div className="mt-4">
          <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
            <div className="space-y-3">
              {metricGlossaryExtra.filter((_, i) => i % 2 === 0).map(renderMetric)}
            </div>
            <div className="space-y-3">
              {metricGlossaryExtra.filter((_, i) => i % 2 === 1).map(renderMetric)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
