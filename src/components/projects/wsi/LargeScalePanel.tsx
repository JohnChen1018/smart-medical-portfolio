"use client";

import { useMemo, useState } from "react";
import { fmtMetric, wsiUi } from "@/lib/wsiUiLabels";
import scores from "@/lib/wsiLargeScaleScores.json";

const METRICS: Array<[string, string]> = [
  ["mPQ+", "mPQ+"],
  ["Mask_PQ", "PQ"],
  ["Mask_DQ", "DQ"],
  ["Mask_SQ", "SQ"],
  ["PQ_Epithelial", "epi"],
  ["PQ_Lymphocyte", "lym"],
  ["PQ_Neutrophil", "neu"],
  ["PQ_Plasma", "pls"],
  ["PQ_Eosinophil", "eos"],
  ["PQ_Connective", "con"],
];

type MetricStats = { mean: number; std: number; n: number };
type RunItem = { order: number; label: string; metrics: Record<string, number> };
type ListedRun = RunItem & { serial: number };
type ScoreGroup = { id: string; items: RunItem[] };
type SortDir = "desc" | "asc";

const data = scores as { groups: ScoreGroup[] };

function usableRuns(items: RunItem[]) {
  return items.filter((item) => (item.metrics["mPQ+"] ?? 0) > 0);
}

function statsFor(items: RunItem[], key: string): MetricStats | undefined {
  const values = usableRuns(items)
    .map((item) => item.metrics[key])
    .filter((value) => value != null && !Number.isNaN(value));
  if (values.length === 0) return undefined;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(values.length - 1, 1);
  return { mean, std: values.length > 1 ? Math.sqrt(variance) : 0, n: values.length };
}

function formatStat(stat: MetricStats | undefined) {
  if (!stat) return "—";
  return `${fmtMetric(stat.mean)} ± ${fmtMetric(stat.std)}`;
}

function sortRuns(items: RunItem[]) {
  return [...items].sort((a, b) => {
    const aFresh = a.label.startsWith("另外") ? 1 : 0;
    const bFresh = b.label.startsWith("另外") ? 1 : 0;
    if (aFresh !== bFresh) return aFresh - bFresh;
    return a.order - b.order;
  });
}

function flattenRuns(): ListedRun[] {
  return data.groups.flatMap((group) => sortRuns(group.items)).map((item, index) => ({
    ...item,
    serial: index + 1,
  }));
}

function byScore(dir: SortDir) {
  const sign = dir === "desc" ? -1 : 1;
  return (a: ListedRun, b: ListedRun) => sign * ((a.metrics["mPQ+"] ?? 0) - (b.metrics["mPQ+"] ?? 0));
}

function expSerial(index: number) {
  return `${wsiUi.simulation.expSerial} ${String(index).padStart(3, "0")}`;
}

function MetricTable({ stats }: { stats: Record<string, MetricStats | undefined> }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {METRICS.map(([key, label]) => (
        <div key={key} className="rounded-lg border border-[#1F2937] bg-[#111827] px-3 py-3">
          <div className="text-base text-[#9CA3AF]">{label}</div>
          <div className="mt-1 font-mono text-lg text-[#E6EDF3]">{formatStat(stats[key])}</div>
        </div>
      ))}
    </div>
  );
}

export function LargeScalePanel() {
  const runs = useMemo(() => flattenRuns(), []);
  const [openRun, setOpenRun] = useState<number | null>(null);
  const [sort, setSort] = useState<SortDir>("desc");
  const listed = useMemo(() => [...runs].sort(byScore(sort)), [runs, sort]);
  const overall = useMemo(
    () => Object.fromEntries(METRICS.map(([key]) => [key, statsFor(runs, key)])),
    [runs],
  );

  return (
    <div className="space-y-3">
      <section className="rounded-2xl border border-cyan-400/40 bg-[#06202A] p-4">
        <h3 className="text-xl font-black text-[#E6EDF3]">目前成績全部綜合</h3>
        <div className="mt-3">
          <MetricTable stats={overall} />
        </div>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-2xl font-black text-[#E6EDF3]">大規模共 {runs.length} 次</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSort("desc")}
            className={`rounded-xl border px-4 py-3 text-base font-bold ${
              sort === "desc"
                ? "border-[#8B5CF6] bg-[#8B5CF6]/20 text-[#E6EDF3]"
                : "border-[#1F2937] bg-[#111827] text-[#BFD2EA]"
            }`}
          >
            最高到最低
          </button>
          <button
            type="button"
            onClick={() => setSort("asc")}
            className={`rounded-xl border px-4 py-3 text-base font-bold ${
              sort === "asc"
                ? "border-[#8B5CF6] bg-[#8B5CF6]/20 text-[#E6EDF3]"
                : "border-[#1F2937] bg-[#111827] text-[#BFD2EA]"
            }`}
          >
            最低到最高
          </button>
        </div>
      </div>
      {listed.map((item) => {
        const open = openRun === item.serial;
        const empty = (item.metrics["mPQ+"] ?? 0) <= 0;
        return (
          <div key={item.serial} className="rounded-xl border border-[#1F2937] bg-[#111827]">
            <button
              type="button"
              onClick={() => setOpenRun(open ? null : item.serial)}
              className="flex w-full flex-col gap-2 px-4 py-4 text-left hover:bg-[#1F2937]/30"
            >
              <span className="text-lg font-bold text-[#E6EDF3]">{expSerial(item.serial)}</span>
              <span className="text-lg text-[#BFD2EA]">
                {empty ? "這次成績是 0" : `StarDist + AdamW · mPQ+ ${fmtMetric(item.metrics["mPQ+"])}`}
              </span>
            </button>
            {open && (
              <div className="grid grid-cols-2 gap-3 border-t border-[#1F2937] px-4 py-4 sm:grid-cols-5">
                {METRICS.map(([key, label]) => (
                  <div key={key}>
                    <div className="text-base text-[#9CA3AF]">{label}</div>
                    <div className="mt-1 font-mono text-xl text-[#E6EDF3]">{fmtMetric(item.metrics[key])}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
