"use client";

import { FaChevronLeft } from "react-icons/fa";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WsiSupplementaryFields } from "@/lib/wsiDriveMetrics";
import { fmtMetric, wsiUi } from "@/lib/wsiUiLabels";
import type { WsiConfig } from "@/lib/wsiResults";

function fmtCount(v: number | undefined) {
  if (v == null || Number.isNaN(v)) return "—";
  return Math.round(v).toLocaleString();
}

export function PrecisionRecallPage({
  onBack,
  effectiveBest,
}: {
  onBack: () => void;
  effectiveBest: WsiConfig & WsiSupplementaryFields & { source?: string };
}) {
  const expLabel = `${wsiUi.simulation.expSerial} ${String(effectiveBest.expId).padStart(2, "0")}`;
  const sourceNote =
    effectiveBest.source === "gdrive"
      ? "雲端 results / student_summary · 10-run mean"
      : "本機實驗彙整 · 10-run mean";

  const extraMetrics = [
    {
      name: "Mask Precision",
      value: effectiveBest.precision,
      fmt: (v: number | undefined) => fmtMetric(v),
      desc: "越高表示預測為正的實例中誤報越少。",
    },
    {
      name: "Mask Recall",
      value: effectiveBest.recall,
      fmt: (v: number | undefined) => fmtMetric(v),
      desc: "越高表示漏抓的真實細胞核越少。",
    },
    {
      name: "Mask F1",
      value: effectiveBest.f1,
      fmt: (v: number | undefined) => fmtMetric(v),
      desc: "精確率與召回率的平衡；兩者兼顧時較高。",
    },
    {
      name: "mean F1@50–95",
      value: effectiveBest.meanF1At5095,
      fmt: (v: number | undefined) => fmtMetric(v),
      desc: "跨多個 IoU 門檻的平均 F1；越高代表定位越穩。",
    },
    {
      name: "mR²（全 patch 計數）",
      value: effectiveBest.mR2FullImage,
      fmt: (v: number | undefined) => fmtMetric(v),
      desc: "接近 1 表示 patch 層級核數量預測越準。",
    },
    {
      name: "mMAE（全 patch 計數）",
      value: effectiveBest.mMAEFullImage,
      fmt: (v: number | undefined) => fmtMetric(v, 2),
      desc: "越低表示計數誤差越小（單位：核數）。",
    },
    {
      name: "TP",
      value: effectiveBest.tp,
      fmt: fmtCount,
      desc: "正確配對的實例數；越高越好（10-run 平均）。",
    },
    {
      name: "FP",
      value: effectiveBest.fp,
      fmt: fmtCount,
      desc: "誤報實例數；越低越好。",
    },
    {
      name: "FN",
      value: effectiveBest.fn,
      fmt: fmtCount,
      desc: "漏抓實例數；越低越好。",
    },
  ];

  const presentMetrics = extraMetrics.filter((m) => m.value != null && !Number.isNaN(m.value));

  const prChart = presentMetrics
    .filter((m) => ["Mask Precision", "Mask Recall", "Mask F1"].includes(m.name))
    .map((m) => ({ name: m.name.replace("Mask ", ""), v: m.value || 0 }));

  const countChart = presentMetrics
    .filter((m) => ["TP", "FP", "FN"].includes(m.name))
    .map((m) => ({ name: m.name, v: m.value || 0 }));

  const hasExtra = presentMetrics.length > 0;

  return (
    <div className="text-base leading-relaxed">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 text-base text-[#9CA3AF] transition hover:text-[#E6EDF3]"
      >
        <FaChevronLeft className="text-xs" />
        {wsiUi.analysis.backToAnalysis}
      </button>

      <header className="mb-8 overflow-hidden rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-[#083344]/80 via-[#111827] to-[#0B0F14] p-6 md:p-8">
        <h1 className="text-3xl font-black text-[#E6EDF3] md:text-4xl">目前數據</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-[#BFD2EA]">
          {expLabel} · {sourceNote}
        </p>
      </header>

      <section className="mb-8 overflow-x-auto rounded-2xl border border-amber-500/30">
        <h2 className="border-b border-amber-500/20 bg-amber-950/20 px-4 py-3 text-lg font-black text-amber-100">
          目前數據
        </h2>
        {!hasExtra ? (
          <p className="px-4 py-6 text-base text-[#9CA3AF]">
            尚無雲端補充資料。請確認 Google Drive 已連線且含 results_final_epoch.xlsx 或 student_summary CSV。
          </p>
        ) : (
          <table className="w-full border-collapse text-base">
            <thead>
              <tr className="bg-[#0F172A] text-left text-[#9CA3AF]">
                <th className="px-4 py-3">指標</th>
                <th className="px-4 py-3 text-right">數值</th>
                <th className="px-4 py-3">這個數值代表什麼</th>
              </tr>
            </thead>
            <tbody>
              {presentMetrics.map((m) => (
                <tr key={m.name} className="border-t border-[#1F2937]">
                  <td className="px-4 py-3 font-semibold text-amber-200">{m.name}</td>
                  <td className="px-4 py-3 text-right font-mono">{m.fmt(m.value)}</td>
                  <td className="px-4 py-3 text-sm leading-7 text-[#BFD2EA]">{m.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#1F2937] bg-[#111827] p-5">
          <h2 className="mb-4 text-lg font-black text-[#E6EDF3]">Precision / Recall / F1</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: "#E6EDF3", fontSize: 12 }} />
                <YAxis domain={[0, 1]} tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#0B0F14", border: "1px solid #4B5563", color: "#E6EDF3" }} />
                <Bar dataKey="v" fill="#34d399" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {countChart.length > 0 && (
          <section className="rounded-2xl border border-[#1F2937] bg-[#111827] p-5">
            <h2 className="mb-1 text-lg font-black text-[#E6EDF3]">TP / FP / FN 實例數</h2>
            <p className="mb-4 text-sm text-[#9CA3AF]">10-run 平均 · 本研究 Excel／雲端有值</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" tick={{ fill: "#E6EDF3", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#0B0F14", border: "1px solid #4B5563", color: "#E6EDF3" }} />
                  <Bar dataKey="v" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
