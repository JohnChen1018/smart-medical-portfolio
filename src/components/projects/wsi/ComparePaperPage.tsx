"use client";

import { FaChevronLeft, FaExternalLinkAlt } from "react-icons/fa";
import { benchmark } from "@/lib/wsiDashboard";
import { wsiUi } from "@/lib/wsiUiLabels";
import { ParamMpqChart } from "@/components/projects/wsi/ParamMpqChart";
import {
  formatWinPct,
  maskRcnnBaseline,
  oursWinsRow,
  parseMetricHead,
  summarizeBenchmarkWins,
  winMarginPct,
} from "@/components/projects/wsi/wsiBenchmarkUtils";

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#1F2937] bg-[#111827] px-5 py-4">
      <div className="text-sm uppercase tracking-widest text-[#6B7280]">{label}</div>
      <div className="mt-2 text-xl font-bold leading-7 text-[#E6EDF3] md:text-2xl">{value}</div>
    </div>
  );
}

export function ComparePaperPage({ onBack }: { onBack: () => void }) {
  const chartData = benchmark.paramCompare.map((p) => ({
    name: p.method.includes("本研究") || p.method.includes("Ours") ? "本研究" : p.method.includes("Mask") ? "Mask-RCNN" : "HoVer-Net",
    mPQ: Number(p.mPQ),
    paramsM: p.paramsNum,
    isOurs: p.method.includes("本研究") || p.method.includes("Ours"),
  }));
  const oursRow = chartData.find((d) => d.isOurs);
  const maskRow = chartData.find((d) => d.name === "Mask-RCNN");
  const paramRatio =
    oursRow && maskRow && oursRow.paramsM > 0
      ? (maskRow.paramsM / oursRow.paramsM).toFixed(1)
      : null;
  const { winCount, total, winRate } = summarizeBenchmarkWins(benchmark.rows);

  const mPQRow = benchmark.rows.find((r) => r.metric.includes("mPQ"));
  const oursMPQ = parseMetricHead(mPQRow?.ours ?? "");
  const baseMPQ = mPQRow ? maskRcnnBaseline(mPQRow) : null;
  const mPQBoostPct =
    oursMPQ != null && baseMPQ != null && baseMPQ > 0
      ? winMarginPct(oursMPQ, baseMPQ)
      : null;

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

      <header className="overflow-hidden rounded-3xl border border-[#8B5CF6]/35 bg-gradient-to-br from-[#241b52]/90 via-[#111827] to-[#0B0F14] p-6 md:p-8">
        <p className="text-sm font-mono uppercase tracking-[0.25em] text-[#A78BFA]">Paper comparison</p>
        <h1 className="mt-2 text-3xl font-black text-[#E6EDF3] md:text-4xl">{wsiUi.analysis.compareTitle}</h1>
        <p className="mt-3 max-w-3xl text-base leading-8 text-[#BFD2EA]">{benchmark.paper}</p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <InfoPill label={wsiUi.analysis.pillAuthor} value={benchmark.authors} />
          <InfoPill label={wsiUi.analysis.pillJournal} value={benchmark.journal} />
          <InfoPill label={wsiUi.analysis.pillRank} value={benchmark.rank} />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={benchmark.doi}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#1F2937] bg-[#0B0F14]/70 px-3 py-2 text-base text-[#22D3EE]"
          >
            <FaExternalLinkAlt className="text-[10px]" /> DOI
          </a>
          <a
            href={benchmark.arxiv}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#1F2937] bg-[#0B0F14]/70 px-3 py-2 text-base text-[#22D3EE]"
          >
            <FaExternalLinkAlt className="text-[10px]" /> arXiv
          </a>
        </div>
      </header>

      <section className="mt-8">
        <h2 className="mb-6 text-xl font-black text-[#E6EDF3]">核心對比</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-400/35 bg-gradient-to-br from-emerald-950/50 to-[#111827] p-6">
            <div className="text-4xl font-black text-emerald-300">{winCount} / {total}</div>
            <div className="mt-2 font-semibold text-[#E6EDF3]">勝過 Mask-RCNN</div>
            <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">
              對 Nunes et al. (2024) colon overall 的 Mask-RCNN，本研究在
              <strong className="text-[#E6EDF3]"> {winCount} 項</strong>指標數值更高
              （共 {total} 項，勝率 {winRate.toFixed(0)}%）。HoVer-Net 欄僅作參考，不決定勝負。
            </p>
          </div>
          <div className="rounded-2xl border border-[#8B5CF6]/35 bg-[#111827] p-6">
            <div className="text-4xl font-black text-[#C4B5FD]">
              {mPQBoostPct != null ? formatWinPct(mPQBoostPct) : "—"}
            </div>
            <div className="mt-2 font-semibold text-[#E6EDF3]">mPQ+ 相對 Mask-RCNN</div>
            <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">
              Mask-RCNN 0.4106 → 本研究 0.4720；這是<strong className="text-[#E6EDF3]"> 核心準確率</strong>
              相對 Mask-RCNN 的增幅。
            </p>
          </div>
          <div className="rounded-2xl border border-sky-400/35 bg-[#111827] p-6">
            <div className="text-4xl font-black text-sky-300">
              {paramRatio ? `1/${paramRatio}` : "—"}
            </div>
            <div className="mt-2 font-semibold text-[#E6EDF3]">相對 Mask-RCNN 參數量</div>
            <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">
              本研究 {benchmark.oursParamsLabel} vs Mask-RCNN {maskRow?.paramsM ?? 44}M；衡量
              <strong className="text-[#E6EDF3]"> 模型有多輕</strong>。
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-black text-[#E6EDF3]">{wsiUi.analysis.keyCompareTitle}</h2>
        <div className="overflow-x-auto rounded-2xl border border-[#1F2937]">
          <table className="w-full border-collapse text-base">
            <thead>
              <tr className="bg-[#0F172A] text-left text-[#9CA3AF]">
                <th className="px-4 py-3">{wsiUi.analysis.colItem}</th>
                <th className="px-4 py-3">{wsiUi.analysis.colMetric}</th>
                <th className="px-4 py-3 text-right">{benchmark.maskRcnnLabel}</th>
                <th className="px-4 py-3 text-right">{benchmark.hoverNetLabel}</th>
                <th className="px-4 py-3 text-right text-emerald-300">{benchmark.oursLabel}</th>
                <th className="px-4 py-3 text-right text-cyan-300">vs Mask-RCNN</th>
                <th className="px-4 py-3">{wsiUi.analysis.colConclusion}</th>
              </tr>
            </thead>
            <tbody>
              {benchmark.rows.map((r, i) => {
                const wins = oursWinsRow(r);
                const ours = parseMetricHead(r.ours);
                const base = maskRcnnBaseline(r);
                const margin = ours != null && base != null ? winMarginPct(ours, base) : null;
                return (
                  <tr key={r.metric} className="border-t border-[#1F2937]">
                    <td className="px-4 py-3 text-[#6B7280]">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-[#E6EDF3]">{r.metric}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-[#9CA3AF]">{r.maskRcnn}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-[#9CA3AF]">{r.hoverNet}</td>
                    <td
                      className={`px-4 py-3 text-right font-mono text-sm font-semibold ${
                        wins ? "text-emerald-300" : "text-amber-300"
                      }`}
                    >
                      {r.ours}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {margin != null ? (
                        <div
                          className={`font-mono text-sm font-bold ${
                            wins ? "text-cyan-300" : "text-amber-300"
                          }`}
                        >
                          {formatWinPct(margin)}
                        </div>
                      ) : (
                        <span className="text-[#6B7280]">—</span>
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm ${
                        wins ? "font-bold text-emerald-300" : "font-semibold text-amber-300"
                      }`}
                    >
                      {margin != null
                        ? wins
                          ? `高於 Mask-RCNN ${formatWinPct(margin)}`
                          : `低於 Mask-RCNN ${formatWinPct(margin)}`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h3 className="mb-2 text-xl font-black text-[#E6EDF3]">{wsiUi.analysis.paramChartTitle}</h3>
        <ParamMpqChart data={chartData} height={320} />
      </section>

      <section className="mt-10">
        <h3 className="mb-2 text-xl font-black text-[#E6EDF3]">{wsiUi.analysis.augTitle}</h3>
        <p className="mb-4 text-sm leading-7 text-[#9CA3AF]">{benchmark.augmentationNote}</p>
        <div className="overflow-x-auto rounded-2xl border border-[#1F2937]">
          <table className="w-full border-collapse text-base">
            <thead>
              <tr className="bg-[#0F172A] text-left text-[#9CA3AF]">
                <th className="px-4 py-3">{wsiUi.analysis.augAspect}</th>
                <th className="px-4 py-3">{wsiUi.analysis.augPaper}</th>
                <th className="px-4 py-3 text-emerald-300">{wsiUi.analysis.augOurs}</th>
              </tr>
            </thead>
            <tbody>
              {benchmark.augmentationCompare.map((row) => (
                <tr key={row.aspect} className="border-t border-[#1F2937]">
                  <td className="px-4 py-3 font-semibold text-[#E6EDF3]">{row.aspect}</td>
                  <td className="px-4 py-3 text-[#9CA3AF]">{row.paper}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-300">{row.ours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
