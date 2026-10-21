import fs from "node:fs";

// Read labels module as text and eval the object (simple approach)
const labelsPath = "src/lib/wsiUiLabels.ts";
const labelsSrc = fs.readFileSync(labelsPath, "utf8");

const dashboard = `"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  FaChevronLeft,
  FaCog,
  FaExternalLinkAlt,
  FaFlask,
  FaTimes,
} from "react-icons/fa";
import {
  applicationSection,
  benchmark,
  dataSection,
  metricGlossary,
  modelingSection,
  wsiMeta,
} from "@/lib/wsiDashboard";
import {
  bestConfig,
  classCounts,
  datasetSplit,
  totalConfigsPlanned,
  totalNuclei,
  wsiConfigs,
  type WsiConfig,
} from "@/lib/wsiResults";
import {
  wsiUi,
  fmtRun,
  fmtEpoch,
  fmtElapsed,
  fmtBest,
  fmtOurs,
} from "@/lib/wsiUiLabels";

const tabs = [
  { key: "application", label: wsiUi.tabs.application },
  { key: "data", label: wsiUi.tabs.data },
  { key: "modeling", label: wsiUi.tabs.modeling },
  { key: "simulation", label: wsiUi.tabs.simulation },
  { key: "analysis", label: wsiUi.tabs.analysis },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export function WorkflowDashboard({ title, backHref }: { title: string; backHref: string }) {
  const [active, setActive] = useState<TabKey>("application");
  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#E6EDF3]">
      <nav className="sticky top-0 z-50 border-b border-[#1F2937] bg-[#0B0F14]/95 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Link href={backHref} className="flex items-center gap-2 text-sm text-[#9CA3AF] transition hover:text-[#E6EDF3]">
              <FaChevronLeft className="text-xs" />
            </Link>
            <FaFlask className="text-[#8B5CF6]" />
            <span className="text-sm font-bold tracking-wide">{wsiUi.workflowTitle}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab, index) => (
              <button key={tab.key} onClick={() => setActive(tab.key)}
                className={\`rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm \${active === tab.key ? "bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/30" : "bg-[#111827] text-[#9CA3AF] hover:text-[#E6EDF3]"}\`}>
                {index + 1}. {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-[#9CA3AF]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              {wsiMeta.connectionLabel}
            </span>
            <FaCog className="text-[#6B7280]" />
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="mb-6 text-xs font-mono uppercase tracking-[0.3em] text-[#8B5CF6]">{title}</p>
        {active === "application" && <ApplicationTab />}
        {active === "data" && <DataTab />}
        {active === "modeling" && <ModelingTab />}
        {active === "simulation" && <SimulationTab />}
        {active === "analysis" && <AnalysisTab />}
      </main>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-black md:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-[#9CA3AF]">{subtitle}</p>}
    </div>
  );
}

function ApplicationTab() {
  const app = applicationSection;
  return (
    <div>
      <SectionHeader title={app.title} subtitle={app.subtitle} />
      <p className="mb-8 max-w-3xl text-sm leading-7 text-[#BFD2EA]">{app.intro}</p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {app.cards.map((card) => (
          <a key={card.id} href={card.sourceUrl} target="_blank" rel="noopener noreferrer"
            className="group relative block h-60 [perspective:1200px]">
            <div className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
              <div className={\`absolute inset-0 flex flex-col rounded-2xl border p-6 [backface-visibility:hidden] \${card.highlight ? "border-[#8B5CF6]/50 bg-gradient-to-br from-[#241b52] to-[#111827]" : "border-[#1F2937] bg-[#111827]"}\`}>
                <span className="text-3xl">{card.icon}</span>
                {card.highlight && <span className="mt-2 w-fit rounded-full bg-[#8B5CF6]/20 px-2 py-0.5 text-[10px] text-[#C4B5FD]">{wsiUi.application.highlight}</span>}
                <h3 className="mt-3 text-xl font-bold text-[#E6EDF3]">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#9CA3AF]">{card.summary}</p>
                <span className="mt-auto text-xs text-[#6B7280]">{wsiUi.application.flipHint}</span>
              </div>
              <div className="absolute inset-0 flex flex-col rounded-2xl border border-[#8B5CF6]/40 bg-gradient-to-br from-[#1E1B4B] to-[#111827] p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <h3 className="text-lg font-bold text-[#C4B5FD]">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#E6EDF3]">{card.detail}</p>
                <span className="mt-auto flex items-center gap-2 text-xs font-semibold text-[#22D3EE]">
                  <FaExternalLinkAlt className="text-[10px]" />{card.sourceLabel}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

const IMAGE_BATCH = 80;

function DataTab() {
  const d = dataSection;
  const [shownCount, setShownCount] = useState(IMAGE_BATCH);
  const images = useMemo(() => Array.from({ length: Math.min(shownCount, datasetSplit.total) }, (_, i) => ({
    src: \`/lizard/conic_\${String(i).padStart(6, "0")}.png\`,
    name: \`conic_\${String(i).padStart(6, "0")}\`,
  })), [shownCount]);
  return (
    <div>
      <SectionHeader title={d.title} />
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {d.datasets.map((ds) => (
          <div key={ds.id} className="rounded-2xl border border-[#1F2937] bg-[#111827] p-5">
            <span className="inline-block rounded-full bg-[#8B5CF6]/15 px-3 py-1 text-xs text-[#C4B5FD]">{ds.tag}</span>
            <h3 className="mt-3 text-lg font-bold text-[#22D3EE]">{ds.title}</h3>
            <p className="mt-2 text-sm text-[#9CA3AF]">{ds.subtitle}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-[#6B7280]">
              <span>{wsiUi.data.licensePrefix}{ds.license}</span><span>{ds.size}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mb-6 rounded-xl border border-[#1F2937] bg-[#0F172A] px-4 py-3 text-xs text-[#9CA3AF]">
        <span className="mr-2 rounded bg-[#1F2937] px-2 py-0.5 font-mono text-[#22D3EE]">.png</span>
        {wsiUi.data.pathPrefix}<span className="font-mono">{d.path}</span>
      </div>
      <h3 className="mb-3 text-sm font-bold text-[#9CA3AF]">{wsiUi.data.splitTitle} {datasetSplit.total} {wsiUi.data.splitSuffix}</h3>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatBox value={datasetSplit.total.toLocaleString()} label={wsiUi.data.totalPatches} />
        <StatBox value={datasetSplit.train.toLocaleString()} label={wsiUi.data.train} />
        <StatBox value={datasetSplit.valid.toLocaleString()} label={wsiUi.data.valid} />
        <StatBox value={datasetSplit.test.toLocaleString()} label={wsiUi.data.test} />
      </div>
      <h3 className="mb-3 text-sm font-bold text-[#9CA3AF]">{wsiUi.data.classTitlePrefix} {classCounts.length} {wsiUi.data.classTitleMid} {totalNuclei.toLocaleString()} {wsiUi.data.classTitleSuffix}</h3>
      <div className="mb-8 overflow-x-auto rounded-2xl border border-[#1F2937]">
        <table className="w-full border-collapse text-sm">
          <thead><tr className="bg-[#0F172A] text-left text-[#9CA3AF]">
            <th className="px-4 py-3">{wsiUi.data.colIndex}</th>
            <th className="px-4 py-3">{wsiUi.data.colClass}</th>
            <th className="px-4 py-3 text-right">{wsiUi.data.colCount}</th>
            <th className="px-4 py-3 text-right">{wsiUi.data.colPct}</th>
            <th className="px-4 py-3">{wsiUi.data.colDist}</th>
          </tr></thead>
          <tbody>{classCounts.map((c, i) => (
            <tr key={c.key} className="border-t border-[#1F2937]">
              <td className="px-4 py-3 text-[#6B7280]">{i + 1}</td>
              <td className="px-4 py-3 font-semibold text-[#E6EDF3]">{c.zh}</td>
              <td className="px-4 py-3 text-right text-[#BFD2EA]">{c.count.toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-[#BFD2EA]">{c.pct}%</td>
              <td className="px-4 py-3"><div className="h-2 w-full max-w-[220px] overflow-hidden rounded-full bg-[#1F2937]"><div className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE]" style={{ width: \`\${Math.max(c.pct, 1.2)}%\` }} /></div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <h3 className="mb-3 text-sm font-bold text-[#9CA3AF]">{wsiUi.data.galleryPrefix} {datasetSplit.total.toLocaleString()} {wsiUi.data.galleryMid} {images.length} {wsiUi.data.gallerySuffix}</h3>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
        {images.map((img) => (
          <div key={img.src} className="group relative aspect-square overflow-hidden rounded-md border border-[#1F2937] bg-black">
            <img src={img.src} alt={img.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-300 group-hover:scale-110" />
          </div>
        ))}
      </div>
      {shownCount < datasetSplit.total && (
        <div className="mt-6 text-center">
          <button onClick={() => setShownCount((n) => Math.min(n + IMAGE_BATCH, datasetSplit.total))}
            className="rounded-lg border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 px-6 py-2 text-sm font-semibold text-[#C4B5FD] transition hover:bg-[#8B5CF6]/20">
            {wsiUi.data.loadMore}（{shownCount} / {datasetSplit.total}）
          </button>
        </div>
      )}
    </div>
  );
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-[#1F2937] bg-[#111827] p-6 text-center">
      <div className="text-2xl font-black text-[#22D3EE] md:text-3xl">{value}</div>
      <div className="mt-1 text-sm text-[#9CA3AF]">{label}</div>
    </div>
  );
}

function ModelingTab() {
  const m = modelingSection;
  return (
    <div>
      <SectionHeader title={wsiUi.modeling.title} subtitle={wsiUi.modeling.subtitle} />
      <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex min-h-[220px] flex-col justify-center rounded-3xl border border-[#8B5CF6]/40 bg-gradient-to-br from-[#241b52] to-[#111827] p-8">
          <div className="text-xs uppercase tracking-[0.3em] text-[#6B7280]">{wsiUi.modeling.archLabel}</div>
          <div className="mt-4 text-5xl font-black text-[#8B5CF6] md:text-6xl">{m.architecture}</div>
          <p className="mt-4 text-sm text-[#BFD2EA]">{wsiUi.modeling.archDesc}</p>
        </div>
        <div className="flex min-h-[220px] flex-col justify-center rounded-3xl border border-[#22D3EE]/40 bg-gradient-to-br from-[#0c3b47] to-[#111827] p-8">
          <div className="text-xs uppercase tracking-[0.3em] text-[#6B7280]">{wsiUi.modeling.optLabel}</div>
          <div className="mt-4 text-5xl font-black text-[#22D3EE] md:text-6xl">{m.optimizer}</div>
          <p className="mt-4 text-sm text-[#BFD2EA]">{wsiUi.modeling.optDesc}</p>
        </div>
      </div>
      <WhyBlock title={wsiUi.modeling.whyStarDist} intro={m.whyStarDist.intro} rows={m.whyStarDist.rows} figure={<StarDistFigure />} />
      <WhyBlock title={wsiUi.modeling.whyAdamW} intro={m.whyAdamW.intro} rows={m.whyAdamW.rows} figure={<AdamWFigure />} />
    </div>
  );
}

function WhyBlock({ title, intro, rows, figure }: { title: string; intro: string; rows: { point: string; detail: string }[]; figure: ReactNode }) {
  return (
    <section className="mb-10">
      <h3 className="mb-2 text-xl font-black text-[#E6EDF3]">{title}</h3>
      <p className="mb-4 max-w-3xl text-sm leading-7 text-[#BFD2EA]">{intro}</p>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#1F2937] bg-[#0F172A] p-4">{figure}</div>
        <div className="overflow-hidden rounded-2xl border border-[#1F2937]">
          <table className="w-full border-collapse text-sm">
            <thead><tr className="bg-[#0F172A] text-left text-[#9CA3AF]">
              <th className="px-4 py-3">{wsiUi.modeling.colPoint}</th>
              <th className="px-4 py-3">{wsiUi.modeling.colDetail}</th>
            </tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.point} className="border-t border-[#1F2937]">
                <td className="px-4 py-3 font-semibold text-[#C4B5FD]">{r.point}</td>
                <td className="px-4 py-3 text-[#BFD2EA]">{r.detail}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function StarDistFigure() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-4">
      <svg viewBox="0 0 200 200" className="h-40 w-40">
        <circle cx="100" cy="100" r="4" fill="#22D3EE" />
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i / 16) * Math.PI * 2; const r = 60 + Math.sin(i * 1.7) * 18;
          return <line key={i} x1="100" y1="100" x2={100 + Math.cos(a) * r} y2={100 + Math.sin(a) * r} stroke="#8B5CF6" strokeWidth="1.5" opacity="0.6" />;
        })}
        <polygon points={Array.from({ length: 16 }).map((_, i) => { const a = (i / 16) * Math.PI * 2; const r = 60 + Math.sin(i * 1.7) * 18; return \`\${100 + Math.cos(a) * r},\${100 + Math.sin(a) * r}\`; }).join(" ")} fill="rgba(139,92,246,0.15)" stroke="#C4B5FD" strokeWidth="2" />
      </svg>
      <p className="text-center text-xs text-[#6B7280]">{wsiUi.modeling.starDistCaption1}<br />{wsiUi.modeling.starDistCaption2}</p>
    </div>
  );
}

function AdamWFigure() {
  return (
    <div className="flex h-full flex-col justify-center gap-3 py-4">
      <div className="space-y-3">
        <div className="rounded-lg bg-[#1F2937] p-3"><div className="text-xs text-[#9CA3AF]">Adam</div><div className="mt-1 text-xs leading-6 text-[#E6EDF3]">{wsiUi.modeling.adamDesc}</div></div>
        <div className="text-center text-[#6B7280]">{wsiUi.modeling.adamWArrow}</div>
        <div className="rounded-lg border border-[#22D3EE]/40 bg-[#0c3b47]/40 p-3"><div className="text-xs text-[#22D3EE]">{wsiUi.modeling.adamWLabel}</div><div className="mt-1 text-xs leading-6 text-[#E6EDF3]">{wsiUi.modeling.adamWDesc}</div></div>
      </div>
      <p className="text-center text-xs text-[#6B7280]">{wsiUi.modeling.adamWCaption}</p>
    </div>
  );
}

interface TrainingStatus {
  connected: boolean; machine: string; framework: string; currentConfig: string;
  run: number; totalRuns: number; epoch: number; totalEpochs: number;
  elapsedSeconds: number; status: string; note: string; updatedAt: string | null;
}

function SimulationTab() {
  const [status, setStatus] = useState<TrainingStatus | null>(null);
  const [openExp, setOpenExp] = useState<number | null>(bestConfig.expId);
  const [showMetrics, setShowMetrics] = useState(false);
  useEffect(() => {
    let alive = true;
    const load = async () => { try { const res = await fetch("/api/training-status", { cache: "no-store" }); if (alive) setStatus(await res.json()); } catch {} };
    load(); const t = setInterval(load, 5000); return () => { alive = false; clearInterval(t); };
  }, []);
  const byId = useMemo(() => { const map = new Map<number, WsiConfig>(); wsiConfigs.forEach((c) => map.set(c.expId, c)); return map; }, []);
  return (
    <div>
      <SectionHeader title={wsiUi.simulation.title} />
      <div className="mb-6"><button onClick={() => setShowMetrics(true)} className="inline-flex items-center gap-2 rounded-lg border border-[#22D3EE]/40 bg-[#22D3EE]/10 px-4 py-2 text-sm font-semibold text-[#22D3EE]"><FaFlask className="text-xs" />{wsiUi.simulation.metricsBtn}</button></div>
      <div className="mb-6 rounded-2xl border border-[#1F2937] bg-gradient-to-br from-[#111827] to-[#0B0F14] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#E6EDF3]">{wsiUi.simulation.liveTitle}</h3>
          <span className={\`flex items-center gap-1.5 text-xs \${status?.connected ? "text-emerald-400" : "text-slate-400"}\`}>
            <span className={\`h-2 w-2 rounded-full \${status?.connected ? "animate-pulse bg-emerald-400" : "bg-slate-500"}\`} />
            {status?.connected ? \`\${wsiUi.simulation.connected}\${status.machine}\` : wsiUi.simulation.disconnected}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <LiveBox label={wsiUi.simulation.framework} value={status?.framework ?? "PyTorch"} />
          <LiveBox label={wsiUi.simulation.currentConfig} value={status?.currentConfig ?? "-"} />
          <LiveBox label={wsiUi.simulation.runProgress} value={status ? fmtRun(status.run, status.totalRuns) : "-"} />
          <LiveBox label={wsiUi.simulation.epochProgress} value={status ? fmtEpoch(status.epoch, status.totalEpochs) : "-"} />
        </div>
        {status && (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-[#9CA3AF]">
              <span>{wsiUi.simulation.epochBar}</span>
              <span>{fmtElapsed(status.elapsedSeconds, status.status)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#1F2937]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE]" style={{ width: \`\${Math.min(100, (status.epoch / Math.max(status.totalEpochs, 1)) * 100)}%\` }} />
            </div>
            <p className="mt-2 text-[11px] text-[#6B7280]">{status.note}</p>
          </div>
        )}
      </div>
      <div className="mb-6 rounded-2xl border border-[#1F2937] bg-[#0F172A] p-5"><h3 className="mb-2 text-sm font-bold text-[#E6EDF3]">{wsiUi.simulation.envTitle}</h3><p className="text-sm text-[#9CA3AF]">{wsiUi.simulation.envValue}</p></div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatBox value={\`\${wsiConfigs.length} / \${totalConfigsPlanned}\`} label={wsiUi.simulation.configsDone} />
        <StatBox value="10" label={wsiUi.simulation.runsPerConfig} />
        <StatBox value={\`exp_\${bestConfig.expId}\`} label={wsiUi.simulation.bestConfig} />
      </div>
      <h3 className="mb-3 text-sm font-bold text-[#9CA3AF]">{wsiUi.simulation.configListPrefix} {totalConfigsPlanned} {wsiUi.simulation.configListSuffix}</h3>
      <div className="space-y-2">{Array.from({ length: totalConfigsPlanned }, (_, i) => i + 1).map((id) => {
        const cfg = byId.get(id); const isBest = id === bestConfig.expId; const isOpen = openExp === id;
        return (
          <div key={id} className={\`rounded-xl border \${isBest ? "border-emerald-400/40 bg-emerald-400/5" : cfg ? "border-[#1F2937] bg-[#111827]" : "border-[#1F2937]/60 bg-[#0B0F14]"}\`}>
            <button onClick={() => cfg && setOpenExp(isOpen ? null : id)} className={\`flex w-full items-center justify-between px-4 py-3 text-left \${cfg ? "cursor-pointer" : "cursor-default"}\`}>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-[#6B7280]">exp_{String(id).padStart(2, "0")}</span>
                {isBest && <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">{wsiUi.simulation.bestBadge}</span>}
                {cfg ? <span className="text-sm text-[#BFD2EA]">StarDist + AdamW，mPQ+ {cfg.mPQ}</span> : <span className="text-sm text-[#4B5563]">{wsiUi.simulation.pendingConfig}</span>}
              </div>
              {cfg && <span className="text-xs text-[#6B7280]">{isOpen ? wsiUi.simulation.collapse : wsiUi.simulation.expand}</span>}
            </button>
            {cfg && isOpen && (
              <div className="border-t border-[#1F2937] px-4 py-4">
                <div className="mb-3 flex flex-wrap gap-2 text-xs text-[#9CA3AF]">
                  <Tag>filter {cfg.filterBase}</Tag><Tag>conv {cfg.convAfter}</Tag><Tag>head {cfg.headBlocks}</Tag><Tag>lr {cfg.lr}</Tag><Tag>loss {cfg.lossWeights}</Tag><Tag>by {cfg.student}</Tag>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                  <Metric label="mPQ+" value={cfg.mPQ} /><Metric label="PQ" value={cfg.maskPQ} /><Metric label="DQ" value={cfg.maskDQ} /><Metric label="SQ" value={cfg.maskSQ} />
                  <Metric label="Precision" value={cfg.precision} /><Metric label="Recall" value={cfg.recall} />
                  <Metric label="epi" value={cfg.pqEpi} /><Metric label="lym" value={cfg.pqLym} /><Metric label="neu" value={cfg.pqNeu} />
                  <Metric label="pls" value={cfg.pqPls} /><Metric label="eos" value={cfg.pqEos} /><Metric label="con" value={cfg.pqCon} />
                </div>
              </div>
            )}
          </div>
        );
      })}</div>
      {showMetrics && <MetricGlossaryModal onClose={() => setShowMetrics(false)} />}
    </div>
  );
}

function LiveBox({ label, value }: { label: string; value: string }) {
  return (<div className="rounded-lg bg-[#0F172A] px-3 py-2"><div className="text-[10px] uppercase tracking-widest text-[#6B7280]">{label}</div><div className="mt-0.5 text-sm font-bold text-[#E6EDF3]">{value}</div></div>);
}
function Tag({ children }: { children: ReactNode }) { return <span className="rounded-md bg-[#0F172A] px-2 py-1 text-xs text-[#BFD2EA]">{children}</span>; }
function Metric({ label, value }: { label: string; value: number }) {
  return (<div className="rounded-lg bg-[#0F172A] px-3 py-2 text-center"><div className="text-[10px] text-[#6B7280]">{label}</div><div className="text-sm font-bold text-[#E6EDF3]">{value}</div></div>);
}
function MetricGlossaryModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#1F2937] bg-[#0B0F14] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-black text-[#E6EDF3]">{wsiUi.simulation.modalTitle}</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-[#9CA3AF] hover:bg-[#1F2937] hover:text-white"><FaTimes /></button>
        </div>
        <p className="mb-4 text-sm text-[#9CA3AF]">{wsiUi.simulation.modalIntro}</p>
        <div className="space-y-3">{metricGlossary.map((m) => (
          <div key={m.key} className="rounded-xl border border-[#1F2937] bg-[#111827] p-4">
            <div className="font-bold text-[#C4B5FD]">{m.name}</div>
            <div className="mt-1 text-sm leading-6 text-[#BFD2EA]">{m.what}</div>
          </div>
        ))}</div>
      </div>
    </div>
  );
}

function AnalysisTab() {
  const [comparePage, setComparePage] = useState(false);
  const bestRecall = useMemo(() => Math.max(...wsiConfigs.map((c) => c.recall)), []);
  const bestMPQ = useMemo(() => Math.max(...wsiConfigs.map((c) => c.mPQ)), []);
  if (comparePage) return <ComparePaperPage onBack={() => setComparePage(false)} />;
  return (
    <div>
      <SectionHeader title={wsiUi.analysis.title} subtitle={wsiUi.analysis.subtitle} />
      <div className="mb-6"><button onClick={() => setComparePage(true)} className="inline-flex items-center gap-2 rounded-lg border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 px-4 py-2 text-sm font-semibold text-[#C4B5FD]"><FaFlask className="text-xs" />{wsiUi.analysis.compareBtn}</button></div>
      <div className="mb-6 rounded-3xl border border-emerald-400/30 bg-emerald-400/5 p-6">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">{wsiUi.analysis.bestBadge}</span>
          <span className="text-sm text-[#9CA3AF]">{fmtBest(bestConfig.expId, bestConfig.student)}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Metric label="mPQ+" value={bestConfig.mPQ} /><Metric label="PQ" value={bestConfig.maskPQ} /><Metric label="DQ" value={bestConfig.maskDQ} />
          <Metric label="SQ" value={bestConfig.maskSQ} /><Metric label="Precision" value={bestConfig.precision} /><Metric label="Recall" value={bestConfig.recall} />
        </div>
      </div>
      <h3 className="mb-3 text-sm font-bold text-[#9CA3AF]">{wsiUi.analysis.rankTitlePrefix} {wsiConfigs.length} {wsiUi.analysis.rankTitleSuffix}</h3>
      <div className="overflow-x-auto rounded-2xl border border-[#1F2937]">
        <table className="w-full border-collapse text-sm">
          <thead><tr className="bg-[#0F172A] text-left text-[#9CA3AF]">
            <th className="px-3 py-3">#</th><th className="px-3 py-3">{wsiUi.analysis.colConfig}</th><th className="px-3 py-3">{wsiUi.analysis.colArch}</th>
            <th className="px-3 py-3 text-right">mPQ+</th><th className="px-3 py-3 text-right">PQ</th><th className="px-3 py-3 text-right">DQ</th>
            <th className="px-3 py-3 text-right">SQ</th><th className="px-3 py-3 text-right">Precision</th><th className="px-3 py-3 text-right">Recall</th><th className="px-3 py-3 text-right">F1</th>
          </tr></thead>
          <tbody>{wsiConfigs.map((c) => {
            const bestM = c.mPQ === bestMPQ; const bestR = c.recall === bestRecall;
            return (
              <tr key={c.expId} className={\`border-t border-[#1F2937] \${bestM ? "bg-emerald-500/10" : ""}\`}>
                <td className="px-3 py-2.5 text-[#6B7280]">{c.rank}</td>
                <td className="px-3 py-2.5 font-mono text-[#E6EDF3]">exp_{String(c.expId).padStart(2, "0")}{bestM && <span className="ml-2 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300">{wsiUi.analysis.bestRow}</span>}</td>
                <td className="px-3 py-2.5 text-[#9CA3AF]">StarDist+AdamW</td>
                <td className="px-3 py-2.5 text-right font-semibold text-[#BFD2EA]">{c.mPQ}</td>
                <td className="px-3 py-2.5 text-right text-[#BFD2EA]">{c.maskPQ}</td>
                <td className="px-3 py-2.5 text-right text-[#BFD2EA]">{c.maskDQ}</td>
                <td className="px-3 py-2.5 text-right text-[#BFD2EA]">{c.maskSQ}</td>
                <td className="px-3 py-2.5 text-right text-[#BFD2EA]">{c.precision}</td>
                <td className={\`px-3 py-2.5 text-right \${bestR ? "font-bold text-emerald-300" : "text-[#BFD2EA]"}\`}>{c.recall}</td>
                <td className="px-3 py-2.5 text-right text-[#BFD2EA]">{c.f1}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-[#6B7280]">{wsiUi.analysis.rankNote}</p>
    </div>
  );
}

function ComparePaperPage({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <button onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-sm text-[#9CA3AF] transition hover:text-[#E6EDF3]"><FaChevronLeft className="text-xs" />{wsiUi.analysis.backToAnalysis}</button>
      <p className="mb-2 text-xs font-mono uppercase tracking-[0.3em] text-[#8B5CF6]">Benchmark Comparison</p>
      <h1 className="text-3xl font-black md:text-4xl">{wsiUi.analysis.compareTitle}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[#BFD2EA]">{benchmark.paper}</p>
      <div className="mt-5 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <InfoPill label={wsiUi.analysis.pillAuthor} value={benchmark.authors} />
        <InfoPill label={wsiUi.analysis.pillJournal} value={benchmark.journal} />
        <InfoPill label={wsiUi.analysis.pillRank} value={benchmark.rank} />
        <InfoPill label={wsiUi.analysis.pillMethod} value={benchmark.method} />
      </div>
      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <a href={benchmark.doi} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-[#1F2937] bg-[#111827] px-3 py-2 text-[#22D3EE]"><FaExternalLinkAlt className="text-[10px]" /> DOI</a>
        <a href={benchmark.arxiv} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-[#1F2937] bg-[#111827] px-3 py-2 text-[#22D3EE]"><FaExternalLinkAlt className="text-[10px]" /> arXiv</a>
      </div>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-[#1F2937]">
        <table className="w-full border-collapse text-sm">
          <thead><tr className="bg-[#0F172A] text-left text-[#9CA3AF]">
            <th className="px-4 py-3">{wsiUi.analysis.colMetric}</th>
            <th className="px-4 py-3 text-right">{benchmark.baselineLabel}</th>
            <th className="px-4 py-3 text-right text-emerald-300">{fmtOurs(bestConfig.expId)}</th>
            <th className="px-4 py-3 text-right">{wsiUi.analysis.colDiff}</th>
            <th className="px-4 py-3">{wsiUi.analysis.colConclusion}</th>
          </tr></thead>
          <tbody>{benchmark.rows.map((r) => (
            <tr key={r.metric} className="border-t border-[#1F2937]">
              <td className="px-4 py-3 font-semibold text-[#E6EDF3]">{r.metric}</td>
              <td className="px-4 py-3 text-right text-[#9CA3AF]">{r.baseline}</td>
              <td className="px-4 py-3 text-right font-semibold text-[#BFD2EA]">{r.ours}</td>
              <td className={\`px-4 py-3 text-right font-bold \${r.diff.startsWith("+") ? "text-emerald-400" : "text-rose-400"}\`}>{r.diff}</td>
              <td className="px-4 py-3 text-[#9CA3AF]">{r.note}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <p className="mt-5 max-w-3xl text-sm leading-7 text-[#BFD2EA]">{benchmark.conclusion}</p>
      <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5 text-sm leading-7 text-yellow-100">
        <span className="mb-1 block font-bold text-yellow-300">{wsiUi.analysis.baselineNoteTitle}</span>
        {wsiUi.analysis.baselineNote}
      </div>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (<div className="rounded-lg border border-[#1F2937] bg-[#111827] px-3 py-2"><div className="text-[10px] uppercase tracking-widest text-[#6B7280]">{label}</div><div className="mt-0.5 text-[#E6EDF3]">{value}</div></div>);
}
`;

fs.writeFileSync("src/components/projects/WorkflowDashboard.tsx", dashboard, "utf8");
console.log("Regenerated WorkflowDashboard.tsx");
