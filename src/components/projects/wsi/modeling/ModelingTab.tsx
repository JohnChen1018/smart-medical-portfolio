"use client";

import { useState } from "react";
import { FaExternalLinkAlt, FaTimes } from "react-icons/fa";
import { SectionHeader } from "@/components/projects/shared/SectionHeader";
import { CollapsibleSection } from "@/components/projects/wsi/shared/WsiLayoutParts";
import { StarDistAnimation } from "@/components/projects/StarDistAnimation";
import { StarDistArchitectureDiagram } from "@/components/projects/wsi/modeling/StarDistArchitectureDiagram";
import { modelingSection } from "@/lib/wsiDashboard";
import { wsiUi } from "@/lib/wsiUiLabels";
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export function ConicParamChart({ bars }: { bars: typeof modelingSection.conicParamBars }) {
  const data = bars.map((b) => ({
    name: b.team,
    paramsM: b.paramsM,
    mPQ: b.mPQ ?? 0,
    highlight: b.highlight,
    medal: b.medal,
    note: b.note,
    rank: b.rank,
    paperUrl: b.paperUrl,
    paperLabel: b.paperLabel,
  }));
  const maxParam = Math.max(...data.map((b) => b.paramsM), 140);

  return (
    <div className="mt-6">
      <h4 className="mb-3 text-sm font-bold text-[#9CA3AF]">{wsiUi.modeling.conicTitle}</h4>
      <div className="h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 8, right: 16, top: 36, bottom: 72 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            <XAxis
              dataKey="name"
              tick={({ x, y, payload }) => {
                const bar = data.find((d) => d.name === payload.value);
                const label = String(payload.value ?? "");
                return (
                  <g transform={`translate(${x},${y})`}>
                    {bar?.paperUrl ? (
                      <a href={bar.paperUrl} target="_blank" rel="noopener noreferrer">
                        <text y={0} dy={14} textAnchor="end" fill="#22D3EE" fontSize={11} transform="rotate(-28)">
                          {label}
                        </text>
                      </a>
                    ) : (
                      <text y={0} dy={14} textAnchor="end" fill="#E6EDF3" fontSize={11} transform="rotate(-28)">
                        {label}
                      </text>
                    )}
                  </g>
                );
              }}
              interval={0}
              height={80}
            />
            <YAxis tick={{ fill: "#9CA3AF", fontSize: 12 }} unit=" M" domain={[0, maxParam * 1.1]} />
            <Tooltip
              contentStyle={{ background: "#111827", border: "1px solid #1F2937", color: "#E6EDF3" }}
              formatter={(v, _n, props) => {
                const row = props.payload as { mPQ?: number; paramsM?: number };
                return [`${v} M · mPQ+ ${row.mPQ?.toFixed(3) ?? "—"}`, "參數量 / 準確率"];
              }}
            />
            <Bar dataKey="paramsM" radius={[6, 6, 0, 0]} barSize={48}>
              {data.map((b) => (
                <Cell key={b.name} fill={b.highlight ? "#34d399" : "#8B5CF6"} />
              ))}
              <LabelList
                dataKey="mPQ"
                position="top"
                formatter={(v) => `mPQ+ ${Number(v).toFixed(3)}`}
                style={{ fill: "#F8FAFC", fontSize: 12, fontWeight: 700 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-4 rounded-xl border border-[#1F2937] bg-[#0F172A] p-4 text-sm leading-7 text-[#BFD2EA]">
        {modelingSection.conicChartSummary}
      </p>
    </div>
  );
}

export function ModelingTab() {
  const m = modelingSection;
  const [hpModal, setHpModal] = useState<"stardist" | "adamw" | null>(null);

  return (
    <div>
      <SectionHeader title={wsiUi.modeling.title} />
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex min-h-[220px] flex-col justify-center rounded-3xl border border-[#8B5CF6]/40 bg-gradient-to-br from-[#241b52] to-[#111827] p-8">
          <div className="text-xs uppercase tracking-[0.3em] text-[#6B7280]">{wsiUi.modeling.archLabel}</div>
          <div className="mt-4 text-5xl font-black text-[#8B5CF6] md:text-6xl">{m.architecture}</div>
          <div className="mt-4">
            <button type="button" onClick={() => setHpModal("stardist")}
              className="text-xs font-semibold text-[#C4B5FD] hover:underline">{wsiUi.modeling.hyperparamBtn} →</button>
          </div>
        </div>
        <div className="flex min-h-[220px] flex-col justify-center rounded-3xl border border-[#22D3EE]/40 bg-gradient-to-br from-[#0c3b47] to-[#111827] p-8">
          <div className="text-xs uppercase tracking-[0.3em] text-[#6B7280]">{wsiUi.modeling.optLabel}</div>
          <div className="mt-4 text-5xl font-black text-[#22D3EE] md:text-6xl">{m.optimizer}</div>
          <div className="mt-4">
            <button type="button" onClick={() => setHpModal("adamw")}
              className="text-xs font-semibold text-[#22D3EE] hover:underline">{wsiUi.modeling.hyperparamBtn} →</button>
          </div>
        </div>
      </div>

      <CollapsibleSection title={wsiUi.modeling.archFlowTitle}>
        <StarDistArchitectureDiagram />
      </CollapsibleSection>

      <CollapsibleSection title={wsiUi.modeling.whyStarDistTable}>
        <StarDistWhyTable rows={m.whyStarDist.rows} conicBars={m.conicParamBars} />
      </CollapsibleSection>

      <CollapsibleSection title={wsiUi.modeling.whyAdamW}>
        <ExpandableWhyTable title="" rows={m.whyAdamW.rows} hideTitle />
      </CollapsibleSection>

      <CollapsibleSection title={wsiUi.modeling.whyStarDist}>
        <StarDistAnimation />
      </CollapsibleSection>

      {hpModal && <HyperparamModal kind={hpModal} onClose={() => setHpModal(null)} />}
    </div>
  );
}

export function ExpandableWhyTable({ title, rows, hideTitle }: { title: string; rows: { point: string; detail: string; paperUrl?: string; paperLabel?: string; refDetail?: string }[]; hideTitle?: boolean }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <section className={hideTitle ? "" : "mb-10"}>
      {!hideTitle && <h3 className="mb-4 text-xl font-black text-[#E6EDF3]">{title}</h3>}
      <div className="overflow-hidden rounded-2xl border border-[#1F2937]">
        <table className="w-full border-collapse text-base">
          <thead><tr className="bg-[#0F172A] text-left text-[#9CA3AF]">
            <th className="w-16 px-4 py-3">{wsiUi.data.colIndex}</th>
            <th className="px-4 py-3">{wsiUi.modeling.colPoint}</th>
            <th className="px-4 py-3">{wsiUi.modeling.colDetail}</th>
          </tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={r.point} className="border-t border-[#1F2937]">
              <td className="px-4 py-4 text-[#6B7280]">{i + 1}</td>
              <td className="px-4 py-4 font-semibold text-[#C4B5FD]">{r.point}</td>
              <td className="px-4 py-4 text-lg leading-8 text-[#E6EDF3]">
                {r.refDetail ? (
                  <button
                    type="button"
                    onClick={() => setOpenIdx(openIdx === i ? null : i)}
                    className="w-full text-left underline decoration-[#22D3EE]/40 underline-offset-4 hover:text-[#E9D5FF]"
                  >
                    {r.detail}
                    <span className="ml-2 text-xs text-[#6B7280]">（點擊展開佐證）</span>
                  </button>
                ) : (
                  r.detail
                )}
                {openIdx === i && r.refDetail && (
                  <div className="mt-4 rounded-xl border border-[#22D3EE]/30 bg-[#22D3EE]/10 p-4">
                    <p className="text-base leading-7 text-[#BFD2EA]">{r.refDetail}</p>
                    {r.paperUrl && (
                      <a href={r.paperUrl} target="_blank" rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#22D3EE] hover:underline">
                        <FaExternalLinkAlt className="text-[10px]" />{r.paperLabel ?? "查看論文"}
                      </a>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}

export function StarDistWhyTable({
  rows,
  conicBars,
}: {
  rows: { point: string; detail: string; paperUrl?: string; paperLabel?: string; refDetail?: string }[];
  conicBars: typeof modelingSection.conicParamBars;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const lightweightIdx = rows.findIndex((r) => r.point === "輕量化模型");
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-[#1F2937]">
      <table className="w-full border-collapse text-base">
        <thead><tr className="bg-[#0F172A] text-left text-[#9CA3AF]">
          <th className="w-16 px-4 py-3">{wsiUi.data.colIndex}</th>
          <th className="px-4 py-3">{wsiUi.modeling.colPoint}</th>
          <th className="px-4 py-3">{wsiUi.modeling.colDetail}</th>
        </tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={r.point} className="border-t border-[#1F2937]">
            <td className="px-4 py-4 align-top text-[#6B7280]">{i + 1}</td>
            <td className="px-4 py-4 align-top font-semibold text-[#C4B5FD]">{r.point}</td>
            <td className="px-4 py-4 text-lg leading-8 text-[#E6EDF3]">
              {r.refDetail || r.paperUrl || i === lightweightIdx ? (
                <button type="button" onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  className="w-full text-left underline decoration-[#8B5CF6]/50 underline-offset-4 hover:text-[#E9D5FF]">
                  {r.detail}
                  <span className="ml-2 text-xs text-[#6B7280]">（點擊展開佐證）</span>
                </button>
              ) : r.detail}
              {openIdx === i && (r.refDetail || r.paperUrl || i === lightweightIdx) && (
                <div className="mt-4 rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 p-4">
                  {r.refDetail && <p className="text-base leading-7 text-[#BFD2EA]">{r.refDetail}</p>}
                  {r.paperUrl && (
                    <a href={r.paperUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#22D3EE] hover:underline">
                      <FaExternalLinkAlt className="text-[10px]" />{r.paperLabel ?? "查看論文"}
                    </a>
                  )}
                  {i === lightweightIdx && <ConicParamChart bars={conicBars} />}
                </div>
              )}
            </td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export function HyperparamModal({ kind, onClose }: { kind: "stardist" | "adamw"; onClose: () => void }) {
  const title = kind === "stardist" ? "StarDist 可調超參數" : "AdamW 可調超參數";
  const rows = kind === "stardist" ? modelingSection.starDistHyperparams : modelingSection.adamWHyperparams;
  const sources = kind === "stardist" ? modelingSection.starDistHyperparamSources : modelingSection.adamWHyperparamSources;
  const [nameSort, setNameSort] = useState<"az" | "za">("az");

  const sortedRows = (() => {
    const copy = [...rows];
    copy.sort((a, b) =>
      nameSort === "az" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );
    return copy;
  })();

  const cycleSort = () => {
    setNameSort((s) => (s === "az" ? "za" : "az"));
  };

  const sortLabel = nameSort === "az" ? "A→Z" : "Z→A";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#1F2937] bg-[#0B0F14] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-black text-[#E6EDF3]">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-[#9CA3AF] hover:bg-[#1F2937] hover:text-white"><FaTimes /></button>
        </div>
        <p className="mb-3 text-sm text-[#9CA3AF]">點「名稱」可在 A→Z / Z→A 之間切換排序。</p>
        <div className="overflow-hidden rounded-xl border border-[#1F2937]">
          <table className="w-full border-collapse text-sm">
            <thead><tr className="bg-[#0F172A] text-left text-[#9CA3AF]">
              <th className="w-14 px-4 py-3">{wsiUi.modeling.hpItem}</th>
              <th className="px-4 py-3">
                <button type="button" onClick={cycleSort} className="font-semibold text-[#22D3EE] hover:text-[#67E8F9]">
                  {wsiUi.modeling.hpName} · {sortLabel}
                </button>
              </th>
              <th className="px-4 py-3">{wsiUi.modeling.hpMeaning}</th>
              <th className="px-4 py-3">{wsiUi.modeling.hpTypical}</th>
            </tr></thead>
            <tbody>{sortedRows.map((r, i) => (
              <tr key={r.name} className="border-t border-[#1F2937]">
                <td className="px-4 py-3 text-[#9CA3AF]">{i + 1}</td>
                <td className="px-4 py-3 font-mono font-semibold text-[#C4B5FD]">{r.name}</td>
                <td className="px-4 py-3 text-[#BFD2EA]">{r.meaning}</td>
                <td className="px-4 py-3 text-[#9CA3AF]">{r.typical ?? "-"}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {kind === "adamw" && modelingSection.adamWHyperparamNote && (
          <p className="mt-3 rounded-lg border border-[#22D3EE]/20 bg-[#22D3EE]/5 px-4 py-3 text-sm leading-6 text-[#BFD2EA]">
            {modelingSection.adamWHyperparamNote}
          </p>
        )}
        <div className="mt-6">
          <h4 className="mb-3 text-sm font-bold text-[#9CA3AF]">資料來源（點擊開啟）</h4>
          <div className="flex flex-col gap-2">
            {sources.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-[#1F2937] bg-[#111827] px-4 py-2.5 text-sm text-[#22D3EE] transition hover:border-[#22D3EE]/40 hover:bg-[#22D3EE]/5">
                <FaExternalLinkAlt className="text-[10px]" />{s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
