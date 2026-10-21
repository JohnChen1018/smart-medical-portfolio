"use client";

import { useMemo, useState } from "react";
import { FaChevronLeft, FaExternalLinkAlt, FaMicroscope, FaRobot } from "react-icons/fa";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AiChatPanel } from "@/components/projects/wsi/AiChatPanel";
import { ParamMpqChart } from "@/components/projects/wsi/ParamMpqChart";
import { summarizeBenchmarkWins } from "@/components/projects/wsi/wsiBenchmarkUtils";
import { benchmark } from "@/lib/wsiDashboard";
import { fmtMetric, wsiUi } from "@/lib/wsiUiLabels";
import type { WsiConfig } from "@/lib/wsiResults";

const DEFAULT_QUPATH_URL = process.env.NEXT_PUBLIC_QUPATH_URL ?? "http://127.0.0.1:8080";

type Tab = "charts" | "qupath";

export function ShowcaseAiPage({
  onBack,
  effectiveBest,
  mergedConfigs,
  focusAi,
}: {
  onBack: () => void;
  effectiveBest: WsiConfig;
  mergedConfigs: Map<number, WsiConfig & { source?: string }>;
  focusAi?: boolean;
}) {
  const [tab, setTab] = useState<Tab>(focusAi ? "charts" : "charts");
  const [qupathUrl, setQupathUrl] = useState(DEFAULT_QUPATH_URL);
  const [qupathLoaded, setQupathLoaded] = useState(false);

  const expLabel = `exp_${String(effectiveBest.expId).padStart(2, "0")}`;
  const { winCount, total } = summarizeBenchmarkWins(benchmark.rows);

  const top5 = useMemo(
    () =>
      [...mergedConfigs.values()]
        .sort((a, b) => (b.mPQ || 0) - (a.mPQ || 0))
        .slice(0, 5)
        .map((c) => ({
          name: `exp_${String(c.expId).padStart(2, "0")}`,
          mPQ: Number(c.mPQ) || 0,
          isBest: c.expId === effectiveBest.expId,
        })),
    [mergedConfigs, effectiveBest.expId],
  );

  const paramChart = benchmark.paramCompare.map((p) => ({
    name: p.method.includes("本研究") || p.method.includes("Ours") ? "本研究" : p.method.includes("Mask") ? "Mask-RCNN" : "HoVer-Net",
    mPQ: Number(p.mPQ),
    paramsM: p.paramsNum,
    isOurs: p.method.includes("本研究") || p.method.includes("Ours"),
  }));

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

      <header className="mb-6 overflow-hidden rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-[#083344]/90 via-[#1a1033]/60 to-[#0B0F14] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.25em] text-[#67E8F9]">Showcase + AI</p>
            <h1 className="mt-2 text-3xl font-black text-[#E6EDF3] md:text-4xl">前端展示 & AI 建議</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#BFD2EA]">
              左側成果圖表與 QuPath 檢視；右側 AI 已載入 {expLabel} 與論文對比，設定金鑰後即可直接對話。
            </p>
          </div>
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-950/40 px-3 py-1 text-xs font-semibold text-cyan-200">
              <FaMicroscope /> 成果展示
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-950/40 px-3 py-1 text-xs font-semibold text-violet-200">
              <FaRobot /> AI 即時建議
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatPill label="最佳配置" value={expLabel} />
          <StatPill label="mPQ+" value={fmtMetric(effectiveBest.mPQ)} accent="emerald" />
          <StatPill label="勝過 Mask-RCNN" value={`${winCount}/${total}`} accent="violet" />
          <StatPill label="參數量" value={benchmark.oursParamsLabel} accent="cyan" />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          <div className="flex gap-2 rounded-xl border border-[#1F2937] bg-[#111827] p-1">
            {(
              [
                { id: "charts" as const, label: "成果圖表" },
                { id: "qupath" as const, label: "QuPath 檢視" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  tab === t.id ? "bg-cyan-600 text-white" : "text-[#9CA3AF] hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "charts" ? (
            <div className="space-y-4">
              <section className="rounded-2xl border border-[#1F2937] bg-[#111827] p-5">
                <h2 className="mb-3 text-sm font-bold text-[#E6EDF3]">Top 5 mPQ+</h2>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={top5}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" tick={{ fill: "#E5E7EB", fontSize: 11 }} />
                      <YAxis domain={[0, 0.55]} tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "#0B0F14", border: "1px solid #4B5563", color: "#E6EDF3" }} />
                      <Bar dataKey="mPQ" radius={[6, 6, 0, 0]}>
                        {top5.map((d) => (
                          <Cell key={d.name} fill={d.isBest ? "#34d399" : "#8B5CF6"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="rounded-2xl border border-[#1F2937] bg-[#111827] p-5">
                <h2 className="mb-3 text-sm font-bold text-[#E6EDF3]">參數量 vs mPQ+（論文對比）</h2>
                <ParamMpqChart data={paramChart} height={260} />
              </section>
            </div>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-[#1F2937] bg-[#0B0F14]">
              <div className="flex flex-wrap items-center gap-2 border-b border-[#1F2937] bg-[#111827] p-3">
                <input
                  type="url"
                  value={qupathUrl}
                  onChange={(e) => {
                    setQupathUrl(e.target.value);
                    setQupathLoaded(false);
                  }}
                  className="min-w-[200px] flex-1 rounded-lg border border-[#1F2937] bg-[#0B0F14] px-3 py-2 text-sm text-[#E6EDF3] outline-none focus:border-cyan-400/50"
                  placeholder="http://127.0.0.1:8080"
                />
                <button
                  type="button"
                  onClick={() => setQupathLoaded(true)}
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
                >
                  載入
                </button>
                <a
                  href={qupathUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-[#1F2937] px-3 py-2 text-sm text-cyan-300"
                >
                  <FaExternalLinkAlt className="text-[10px]" /> 新分頁
                </a>
              </div>
              {!qupathLoaded ? (
                <div className="flex min-h-[420px] items-center justify-center text-sm text-[#6B7280]">
                  啟動 QuPath Web 後按「載入」嵌入檢視
                </div>
              ) : (
                <iframe title="QuPath" src={qupathUrl} className="min-h-[420px] w-full border-0 bg-black" allow="fullscreen" />
              )}
            </section>
          )}
        </div>

        <div className="xl:col-span-2">
          <AiChatPanel effectiveBest={effectiveBest} compact />
        </div>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "emerald" | "violet" | "cyan";
}) {
  const colors = {
    emerald: "text-emerald-300",
    violet: "text-violet-300",
    cyan: "text-cyan-300",
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 backdrop-blur-sm">
      <div className="text-[10px] uppercase tracking-widest text-[#9CA3AF]">{label}</div>
      <div className={`mt-1 text-xl font-black ${accent ? colors[accent] : "text-white"}`}>{value}</div>
    </div>
  );
}
