"use client";

import { useMemo, useState } from "react";
import { FaChevronLeft } from "react-icons/fa";
import { fmtMetric, wsiUi } from "@/lib/wsiUiLabels";
import type { WsiConfig } from "@/lib/wsiResults";

type SortKey =
  | "mPQ"
  | "maskPQ"
  | "maskDQ"
  | "maskSQ"
  | "pqNeu"
  | "pqEpi"
  | "pqLym"
  | "pqPls"
  | "pqEos"
  | "pqCon"
  | "expId";

const HEADERS: { key: SortKey; label: string }[] = [
  { key: "mPQ", label: "mPQ+" },
  { key: "maskPQ", label: "PQ" },
  { key: "maskDQ", label: "DQ" },
  { key: "maskSQ", label: "SQ" },
  { key: "pqNeu", label: "neu" },
  { key: "pqEpi", label: "epi" },
  { key: "pqLym", label: "lym" },
  { key: "pqPls", label: "pls" },
  { key: "pqEos", label: "eos" },
  { key: "pqCon", label: "con" },
];

function cell(v: number | undefined | null) {
  if (v == null || Number.isNaN(v) || v === 0) return "—";
  return fmtMetric(v);
}

export function ResultsOverviewPage({
  onBack,
  mergedConfigs,
  effectiveBest,
}: {
  onBack: () => void;
  mergedConfigs: Map<number, WsiConfig & { source?: string }>;
  effectiveBest: WsiConfig;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("mPQ");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [readingMode, setReadingMode] = useState(false);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir(key === "expId" ? "asc" : "desc");
    }
  };

  const ranked = useMemo(() => {
    const list = [...mergedConfigs.values()];
    list.sort((a, b) => {
      const av = Number(a[sortKey]) || 0;
      const bv = Number(b[sortKey]) || 0;
      return sortDir === "desc" ? bv - av : av - bv;
    });
    return list;
  }, [mergedConfigs, sortKey, sortDir]);

  const arrow = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortDir === "desc" ? " ↓" : " ↑";
  };

  return (
    <div className={`leading-relaxed ${readingMode ? "text-lg" : "text-base"}`}>
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 text-base text-[#9CA3AF] transition hover:text-[#E6EDF3]"
      >
        <FaChevronLeft className="text-xs" />
        {wsiUi.analysis.backToAnalysis}
      </button>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-2 text-3xl font-black text-[#E6EDF3]">{wsiUi.analysis.overviewBtn}</h1>
          <p className="text-base text-[#9CA3AF]">
            全部 {ranked.length} 組 · 點欄位切換高→低／低→高 · 目前最佳{" "}
            {wsiUi.simulation.expSerial} {String(effectiveBest.expId).padStart(2, "0")}（mPQ+{" "}
            {fmtMetric(effectiveBest.mPQ)}）
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReadingMode((v) => !v)}
          className="rounded-lg border border-[#334155] bg-[#111827] px-4 py-2 text-sm font-semibold text-[#C4B5FD] hover:border-violet-400/50"
        >
          {readingMode ? "一般字級" : "閱讀模式（放大）"}
        </button>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => toggleSort("expId")}
          className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
            sortKey === "expId"
              ? "bg-[#8B5CF6] text-white"
              : "border border-[#1F2937] bg-[#111827] text-[#9CA3AF] hover:text-[#E6EDF3]"
          }`}
        >
          實驗序號{arrow("expId")}
        </button>
        {HEADERS.map((h) => (
          <button
            key={h.key}
            type="button"
            onClick={() => toggleSort(h.key)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
              sortKey === h.key
                ? "bg-[#8B5CF6] text-white"
                : "border border-[#1F2937] bg-[#111827] text-[#9CA3AF] hover:text-[#E6EDF3]"
            }`}
          >
            {h.label}
            {arrow(h.key)}
          </button>
        ))}
      </div>
      <div className="max-h-[70vh] overflow-auto rounded-2xl border border-[#1F2937]">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#0F172A] text-left text-[#9CA3AF] shadow-[0_1px_0_0_#1F2937]">
              <th className="bg-[#0F172A] px-3 py-3">#</th>
              <th className="bg-[#0F172A] px-3 py-3">
                <button type="button" onClick={() => toggleSort("expId")} className="font-semibold hover:text-[#E6EDF3]">
                  實驗序號{arrow("expId")}
                </button>
              </th>
              {HEADERS.map((h) => (
                <th key={h.key} className="bg-[#0F172A] px-3 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort(h.key)}
                    className={`font-semibold transition hover:text-[#E6EDF3] ${
                      sortKey === h.key ? "text-[#22D3EE]" : "text-[#9CA3AF]"
                    }`}
                  >
                    {h.label}
                    {arrow(h.key)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranked.map((c, i) => (
              <tr
                key={c.expId}
                className={`border-t border-[#1F2937] ${
                  c.expId === effectiveBest.expId ? "bg-emerald-500/10" : ""
                }`}
              >
                <td className="px-3 py-2.5 text-[#9CA3AF]">{i + 1}</td>
                <td className="px-3 py-2.5 font-semibold text-[#E6EDF3]">
                  {String(c.expId).padStart(2, "0")}
                </td>
                <td className="px-3 py-2.5 text-right font-bold text-[#22D3EE]">
                  {fmtMetric(c.mPQ)}
                </td>
                <td className="px-3 py-2.5 text-right text-[#BFD2EA]">{cell(c.maskPQ)}</td>
                <td className="px-3 py-2.5 text-right text-[#BFD2EA]">{cell(c.maskDQ)}</td>
                <td className="px-3 py-2.5 text-right text-[#BFD2EA]">{cell(c.maskSQ)}</td>
                <td className="px-3 py-2.5 text-right text-[#BFD2EA]">{cell(c.pqNeu)}</td>
                <td className="px-3 py-2.5 text-right text-[#BFD2EA]">{cell(c.pqEpi)}</td>
                <td className="px-3 py-2.5 text-right text-[#BFD2EA]">{cell(c.pqLym)}</td>
                <td className="px-3 py-2.5 text-right text-[#BFD2EA]">{cell(c.pqPls)}</td>
                <td className="px-3 py-2.5 text-right text-[#BFD2EA]">{cell(c.pqEos)}</td>
                <td className="px-3 py-2.5 text-right text-[#BFD2EA]">{cell(c.pqCon)}</td>
                <td className="px-3 py-2.5 text-right text-[#BFD2EA]">{cell(c.map50Segm)}</td>
                <td className="px-3 py-2.5 text-right text-[#BFD2EA]">{cell(c.map50Bbox)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
