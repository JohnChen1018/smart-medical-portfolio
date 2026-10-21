"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FaChevronLeft,
  FaExternalLinkAlt,
  FaFlask,
  FaTimes,
} from "react-icons/fa";
import { SectionHeader } from "@/components/projects/shared/SectionHeader";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { isStepKey } from "@/lib/i18n/copy";
import { useTrainingStatus } from "@/components/projects/shared/useTrainingStatus";
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
import {
  mpoxApplicationSection,
  mpoxBenchmark,
  mpoxDataSection,
  mpoxMeta,
  mpoxMetricGlossary,
  mpoxModelingSection,
} from "@/lib/mpoxDashboard";
import {
  mpoxAverage10,
  mpoxAverage500,
  mpoxBestRun,
  mpoxClassCounts,
  mpoxRuns,
  mpoxSplit,
  mpoxTotalImages,
} from "@/lib/mpoxResults";
import { mpoxUi } from "@/lib/mpoxUiLabels";

const tabs = [
  { key: "application", label: mpoxUi.tabs.application },
  { key: "data", label: mpoxUi.tabs.data },
  { key: "modeling", label: mpoxUi.tabs.modeling },
  { key: "simulation", label: mpoxUi.tabs.simulation },
  { key: "analysis", label: mpoxUi.tabs.analysis },
] as const;

type TabKey = (typeof tabs)[number]["key"];

const MPOX_METRICS = [
  { key: "testAcc", label: "Test Acc", pick: (r: (typeof mpoxRuns)[number]) => r.testAcc, fmt: (v: number) => `${v.toFixed(2)}%` },
  { key: "auc", label: "AUC", pick: (r: (typeof mpoxRuns)[number]) => r.auc, fmt: (v: number) => v.toFixed(4) },
  { key: "f1", label: "F1", pick: (r: (typeof mpoxRuns)[number]) => r.f1, fmt: (v: number) => v.toFixed(4) },
  { key: "precision", label: "Precision", pick: (r: (typeof mpoxRuns)[number]) => r.precision, fmt: (v: number) => v.toFixed(4) },
  { key: "recall", label: "Recall", pick: (r: (typeof mpoxRuns)[number]) => r.recall, fmt: (v: number) => v.toFixed(4) },
] as const;

export function MpoxWorkflowDashboard({
  title,
  backHref,
}: {
  title: string;
  backHref: string;
}) {
  const [active, setActive] = useState<TabKey>("application");
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#E6EDF3]">
      <nav
        className="sticky z-40 border-b border-[#1F2937] bg-[#0B0F14]/95 px-4 py-3 backdrop-blur-md sm:px-6"
        style={{ top: "var(--site-header-h, 4rem)" }}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link href={backHref} className="flex shrink-0 items-center gap-2 rounded-full border border-[#1F2937] bg-[#111827] px-4 py-2 text-base font-semibold text-[#E6EDF3] transition hover:border-[#4ADE80]/50">
                <FaChevronLeft className="text-xs" />
                {t.detail.back}
              </Link>
              <h1 className="truncate text-xl font-black text-[#E6EDF3]">{title}</h1>
            </div>
            <span className="flex items-center gap-1.5 text-sm text-[#9CA3AF]">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {mpoxMeta.connectionLabel}
            </span>
          </div>
          <div className="flex gap-1 overflow-x-auto" role="tablist">
            {tabs.map((tab, index) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active === tab.key}
                onClick={() => setActive(tab.key)}
                className={`shrink-0 rounded-full px-4 py-2 text-base font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4ADE80] ${active === tab.key ? "bg-[#8B5CF6] text-white" : "bg-[#111827] text-[#BFD2EA] hover:text-[#E6EDF3]"}`}
              >
                {index + 1}. {isStepKey(tab.key) ? t.steps[tab.key].label : tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {active === "application" && <ApplicationTab />}
        {active === "data" && <DataTab />}
        {active === "modeling" && <ModelingTab />}
        {active === "simulation" && <SimulationTab />}
        {active === "analysis" && <AnalysisTab />}
      </main>
    </div>
  );
}

function ApplicationTab() {
  const app = mpoxApplicationSection;
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div>
      <SectionHeader title={app.title} subtitle={app.subtitle} />
      <p className="mb-8 max-w-3xl text-base leading-8 text-[#BFD2EA]">{app.intro}</p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {app.cards.map((card) => {
          const open = openId === card.id;
          return (
            <div key={card.id} className="relative h-72 [perspective:1200px]">
              <div
                className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
                  open ? "[transform:rotateY(180deg)]" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : card.id)}
                  className={`absolute inset-0 flex flex-col overflow-hidden rounded-2xl border p-6 text-left [backface-visibility:hidden] ${
                    card.highlight
                      ? "border-[#8B5CF6]/50 bg-gradient-to-br from-[#241b52] to-[#111827]"
                      : "border-[#1F2937] bg-[#111827]"
                  }`}
                >
                  <span className="text-3xl">{card.icon}</span>
                  {card.highlight && (
                    <span className="mt-2 w-fit rounded-full bg-[#8B5CF6]/20 px-2 py-0.5 text-xs font-semibold text-[#C4B5FD]">
                      {mpoxUi.application.highlight}
                    </span>
                  )}
                  <h3 className="mt-3 text-xl font-bold text-[#E6EDF3]">{card.title}</h3>
                  <p className="mt-3 text-base leading-7 text-[#BFD2EA]">{card.summary}</p>
                </button>
                <div className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-[#8B5CF6]/40 bg-gradient-to-br from-[#1E1B4B] to-[#111827] p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <h3 className="text-lg font-bold text-[#C4B5FD]">{card.title}</h3>
                  <p className="mt-3 flex-1 overflow-y-auto text-base leading-7 text-[#E6EDF3]">{card.detail}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <a
                      href={card.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#22D3EE]"
                    >
                      <FaExternalLinkAlt className="text-[10px]" />
                      {card.sourceLabel}
                    </a>
                    <button type="button" onClick={() => setOpenId(null)} className="text-sm text-[#9CA3AF] hover:text-[#E6EDF3]">
                      翻回正面
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const IMAGE_BATCH = 80;

function DataTab() {
  const d = mpoxDataSection;
  const [offset, setOffset] = useState(0);
  const [labelFilter, setLabelFilter] = useState("all");
  const [images, setImages] = useState<{ file: string; label: string; category: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadImages = useCallback(async (nextOffset: number, filter: string, append: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mpox-images?offset=${nextOffset}&limit=${IMAGE_BATCH}&label=${filter}`);
      const data = await res.json();
      setTotal(data.total);
      setImages((prev) => (append ? [...prev, ...data.images] : data.images));
      setOffset(nextOffset + data.images.length);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setOffset(0);
    loadImages(0, labelFilter, false);
  }, [labelFilter, loadImages]);

  return (
    <div>
      <SectionHeader title={d.title} />
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {d.datasets.map((ds) => (
          <div key={ds.id} className="rounded-2xl border border-[#1F2937] bg-[#111827] p-5">
            <span className="inline-block rounded-full bg-[#8B5CF6]/15 px-3 py-1 text-xs text-[#C4B5FD]">{ds.tag}</span>
            <h3 className="mt-3 text-lg font-bold text-[#22D3EE]">{ds.title}</h3>
            <p className="mt-2 text-sm text-[#9CA3AF]">{ds.subtitle}</p>
            <div className="mt-4 text-xs text-[#6B7280]">{ds.size}</div>
          </div>
        ))}
      </div>
      <h3 className="mb-3 text-sm font-bold text-[#9CA3AF]">{mpoxUi.data.splitTitle}{d.splitNote}{mpoxUi.data.splitSuffix}</h3>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatBox value={mpoxSplit.total.toLocaleString()} label={mpoxUi.data.totalImages} />
        <StatBox value={mpoxSplit.train.toLocaleString()} label={mpoxUi.data.train} />
        <StatBox value={mpoxSplit.test.toLocaleString()} label={mpoxUi.data.test} />
      </div>
      <h3 className="mb-3 text-sm font-bold text-[#9CA3AF]">{mpoxUi.data.classTitle}</h3>
      <div className="mb-8 overflow-x-auto rounded-2xl border border-[#1F2937]">
        <table className="w-full border-collapse text-sm">
          <thead><tr className="bg-[#0F172A] text-left text-[#9CA3AF]">
            <th className="px-4 py-3">{mpoxUi.data.colItem}</th>
            <th className="px-4 py-3">{mpoxUi.data.colClass}</th>
            <th className="px-4 py-3 text-right">{mpoxUi.data.colCount}</th>
            <th className="px-4 py-3 text-right">{mpoxUi.data.colPct}</th>
          </tr></thead>
          <tbody>{mpoxClassCounts.map((c, i) => (
            <tr key={c.key} className="border-t border-[#1F2937]">
              <td className="px-4 py-3 text-[#6B7280]">{i + 1}</td>
              <td className="px-4 py-3 font-semibold text-[#E6EDF3]">{c.zh}</td>
              <td className="px-4 py-3 text-right text-[#BFD2EA]">{c.count.toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-[#BFD2EA]">{c.pct}%</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-bold text-[#9CA3AF]">{mpoxUi.data.galleryPrefix} {mpoxTotalImages.toLocaleString()} {mpoxUi.data.galleryMid} {images.length} {mpoxUi.data.gallerySuffix}</h3>
        <div className="ml-auto flex gap-2">
          {[
            { key: "all", label: mpoxUi.data.filterAll },
            { key: "Monkeypox", label: mpoxUi.data.filterMonkeypox },
            { key: "Others", label: mpoxUi.data.filterOthers },
          ].map((f) => (
            <button key={f.key} onClick={() => setLabelFilter(f.key)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold ${labelFilter === f.key ? "bg-[#8B5CF6] text-white" : "bg-[#111827] text-[#9CA3AF]"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
        {images.map((img) => (
          <div key={`${img.category}/${img.file}`} className="group relative aspect-square overflow-hidden rounded-md border border-[#1F2937] bg-black">
            <img
              src={`/api/mpox-images/${encodeURIComponent(img.category)}/${encodeURIComponent(img.file)}`}
              alt={img.file}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
            />
          </div>
        ))}
      </div>
      {images.length < total && (
        <div className="mt-6 text-center">
          <button disabled={loading} onClick={() => loadImages(offset, labelFilter, true)}
            className="rounded-lg border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 px-6 py-2 text-sm font-semibold text-[#C4B5FD] transition hover:bg-[#8B5CF6]/20 disabled:opacity-50">
            {loading ? "載入中…" : `${mpoxUi.data.loadMore}（${images.length} / ${total}）`}
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
  const m = mpoxModelingSection;
  const [hpOpen, setHpOpen] = useState(false);
  const maxParam = Math.max(...m.paramCompareBars.map((b) => b.paramsM), 25);
  return (
    <div>
      <SectionHeader title={mpoxUi.modeling.title} />
      <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex min-h-[220px] flex-col justify-center rounded-3xl border border-[#8B5CF6]/40 bg-gradient-to-br from-[#241b52] to-[#111827] p-8">
          <div className="text-xs uppercase tracking-[0.3em] text-[#6B7280]">{mpoxUi.modeling.archLabel}</div>
          <div className="mt-4 text-5xl font-black text-[#8B5CF6] md:text-6xl">{m.architecture}</div>
          <p className="mt-4 text-sm text-[#BFD2EA]">{mpoxUi.modeling.archDesc}</p>
          <div className="mt-4">
            <button type="button" onClick={() => setHpOpen(true)} className="text-xs font-semibold text-[#C4B5FD] hover:underline">{mpoxUi.modeling.hyperparamBtn} →</button>
          </div>
        </div>
        <div className="flex min-h-[220px] flex-col justify-center rounded-3xl border border-[#22D3EE]/40 bg-gradient-to-br from-[#0c3b47] to-[#111827] p-8">
          <div className="text-xs uppercase tracking-[0.3em] text-[#6B7280]">{mpoxUi.modeling.optLabel}</div>
          <div className="mt-4 text-5xl font-black text-[#22D3EE] md:text-6xl">{m.optimizer}</div>
          <p className="mt-4 text-sm text-[#BFD2EA]">{mpoxUi.modeling.optDesc}</p>
        </div>
      </div>
      <WhyTable title={mpoxUi.modeling.whyArch} rows={m.whyArchitecture.rows} />
      <section className="mb-10 rounded-2xl border border-[#1F2937] bg-[#111827] p-6">
        <h3 className="mb-1 text-xl font-black text-[#E6EDF3]">{mpoxUi.modeling.paramTitle}</h3>
        <p className="mb-6 text-sm text-[#9CA3AF]">{mpoxUi.modeling.paramNote}</p>
        <div className="space-y-3">
          {m.paramCompareBars.map((bar) => (
            <div key={bar.team} className={bar.highlight ? "rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3" : ""}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className={`font-semibold ${bar.highlight ? "text-emerald-300" : "text-[#E6EDF3]"}`}>{bar.team}</span>
                <span className="font-mono text-[#22D3EE]">{bar.paramsM} M</span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-[#0F172A]">
                <div className={`h-full rounded-full ${bar.highlight ? "bg-gradient-to-r from-emerald-400 to-[#22D3EE]" : "bg-gradient-to-r from-[#8B5CF6] to-[#6B7280]"}`}
                  style={{ width: `${Math.max(4, (bar.paramsM / maxParam) * 100)}%` }} />
              </div>
              {bar.note && <p className="mt-1 text-xs text-[#9CA3AF]">{bar.note}</p>}
            </div>
          ))}
        </div>
      </section>
      <WhyTable title={mpoxUi.modeling.whyOpt} rows={m.whyOptimizer.rows} />
      {hpOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={() => setHpOpen(false)}>
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#1F2937] bg-[#0B0F14] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-black text-[#E6EDF3]">MobileNet-V2 可調超參數</h3>
              <button onClick={() => setHpOpen(false)} className="rounded-lg p-2 text-[#9CA3AF] hover:bg-[#1F2937]"><FaTimes /></button>
            </div>
            <table className="w-full border-collapse text-sm">
              <thead><tr className="bg-[#0F172A] text-left text-[#9CA3AF]">
                <th className="px-4 py-3">{mpoxUi.modeling.colItem}</th>
                <th className="px-4 py-3">{mpoxUi.modeling.hpName}</th>
                <th className="px-4 py-3">{mpoxUi.modeling.hpMeaning}</th>
                <th className="px-4 py-3">{mpoxUi.modeling.hpTypical}</th>
              </tr></thead>
              <tbody>{m.hyperparams.map((r, i) => (
                <tr key={r.name} className="border-t border-[#1F2937]">
                  <td className="px-4 py-3 text-[#6B7280]">{i + 1}</td>
                  <td className="px-4 py-3 font-mono text-[#C4B5FD]">{r.name}</td>
                  <td className="px-4 py-3 text-[#BFD2EA]">{r.meaning}</td>
                  <td className="px-4 py-3 text-[#9CA3AF]">{r.typical}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function WhyTable({ title, rows }: { title: string; rows: { point: string; detail: string }[] }) {
  return (
    <section className="mb-10">
      <h3 className="mb-4 text-xl font-black text-[#E6EDF3]">{title}</h3>
      <div className="overflow-hidden rounded-2xl border border-[#1F2937]">
        <table className="w-full border-collapse text-sm">
          <thead><tr className="bg-[#0F172A] text-left text-[#9CA3AF]">
            <th className="px-4 py-3">{mpoxUi.modeling.colItem}</th>
            <th className="px-4 py-3">{mpoxUi.modeling.colPoint}</th>
            <th className="px-4 py-3">{mpoxUi.modeling.colDetail}</th>
          </tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={r.point} className="border-t border-[#1F2937]">
              <td className="px-4 py-3 text-[#6B7280]">{i + 1}</td>
              <td className="px-4 py-3 font-semibold text-[#C4B5FD]">{r.point}</td>
              <td className="px-4 py-3 text-[#BFD2EA]">{r.detail}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}

function SimulationTab() {
  const [showMetrics, setShowMetrics] = useState(false);
  const [openRun, setOpenRun] = useState<number | null>(mpoxBestRun.run);
  const status = useTrainingStatus();
  const isLive = status?.connected && status.status === "running";
  if (showMetrics) return <MetricsPage onBack={() => setShowMetrics(false)} />;
  return (
    <div>
      <SectionHeader title={mpoxUi.simulation.title} />
      <div className="mb-6">
        <button onClick={() => setShowMetrics(true)} className="inline-flex items-center gap-2 rounded-lg border border-[#22D3EE]/40 bg-[#22D3EE]/10 px-4 py-2 text-sm font-semibold text-[#22D3EE]">
          <FaFlask className="text-xs" />{mpoxUi.simulation.metricsBtn}
        </button>
      </div>
      <div className="mb-6 min-h-[220px] rounded-2xl border border-[#1F2937] bg-black p-6">
        {isLive ? (
          <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
            <div className="mb-2 flex items-center gap-2 text-sm text-emerald-400">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
              {mpoxUi.simulation.liveTitle} · {status!.machine}
            </div>
            <div className="font-mono text-4xl font-black tracking-wide text-white md:text-5xl">
              Run {status!.run} / {status!.totalRuns}
            </div>
            <div className="mt-2 font-mono text-3xl font-bold text-[#22D3EE] md:text-4xl">
              Epoch {status!.epoch} / {status!.totalEpochs}
            </div>
          </div>
        ) : (
          <div className="flex min-h-[180px] items-center justify-center">
            <span className="text-sm text-[#333]">—</span>
          </div>
        )}
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatBox value="10 / 10" label={mpoxUi.simulation.configsDone} />
        <StatBox value="MB=32, LR=1e-4, Ep=30" label={mpoxUi.simulation.bestConfig} />
      </div>
      <h3 className="mb-3 text-sm font-bold text-[#9CA3AF]">{mpoxUi.simulation.runListTitle}</h3>
      <div className="space-y-2">
        {mpoxRuns.map((run) => {
          const isBest = run.run === mpoxBestRun.run;
          const isOpen = openRun === run.run;
          return (
            <div key={run.run} className={`rounded-xl border ${isBest ? "border-emerald-400/40 bg-emerald-400/5" : "border-[#1F2937] bg-[#111827]"}`}>
              <button onClick={() => setOpenRun(isOpen ? null : run.run)} className="flex w-full items-center justify-between px-4 py-3 text-left">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold text-[#E6EDF3]">Run {run.run}</span>
                  {isBest && <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">最佳</span>}
                  <span className="text-sm text-[#BFD2EA]">Test Acc {run.testAcc.toFixed(2)}%</span>
                </div>
                <span className="text-xs text-[#6B7280]">{isOpen ? mpoxUi.simulation.collapse : mpoxUi.simulation.expand}</span>
              </button>
              {isOpen && (
                <div className="border-t border-[#1F2937] px-4 pb-4">
                  <p className="mb-3 pt-3 text-xs font-bold text-[#9CA3AF]">{mpoxUi.simulation.hpTitle}</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Metric label="Batch" value={String(run.batchSize)} />
                    <Metric label="LR" value={String(run.lr)} />
                    <Metric label="Epochs" value={String(run.epochs)} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Metric label="Train Acc" value={`${run.trainAcc}%`} />
                  <Metric label="Test Acc" value={`${run.testAcc.toFixed(2)}%`} />
                  <Metric label="AUC" value={run.auc.toFixed(4)} />
                  <Metric label="F1" value={run.f1.toFixed(4)} />
                  <Metric label="Precision" value={run.precision.toFixed(4)} />
                  <Metric label="Recall" value={run.recall.toFixed(4)} />
                  <Metric label="Loss" value={run.loss.toFixed(4)} />
                  <Metric label="Time (s)" value={run.timeSpent.toFixed(1)} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetricsPage({ onBack }: { onBack: () => void }) {
  const [openFormula, setOpenFormula] = useState<string | null>(null);
  return (
    <div>
      <button onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-sm text-[#9CA3AF] hover:text-[#E6EDF3]"><FaChevronLeft className="text-xs" />{mpoxUi.simulation.metricsBack}</button>
      <h1 className="text-3xl font-black">評量指標解析</h1>
      <div className="mt-8 space-y-4">
        {mpoxMetricGlossary.map((m) => (
          <article key={m.key} className="rounded-2xl border border-[#1F2937] bg-[#111827] p-5">
            <button type="button" onClick={() => m.formula && setOpenFormula(openFormula === m.key ? null : m.key)}
              className={`text-left text-lg font-black transition ${m.formula ? "cursor-pointer text-[#C4B5FD] hover:text-[#E9D5FF]" : "cursor-default text-[#C4B5FD]"}`}>
              {m.name}{m.formula && <span className="ml-2 text-xs font-normal text-[#6B7280]">（點擊查看公式）</span>}
            </button>
            <p className="mt-2 text-sm leading-7 text-[#BFD2EA]">{m.what}</p>
            {m.formula && openFormula === m.key && (
              <code className="mt-3 block rounded-lg bg-[#0F172A] px-4 py-3 font-mono text-sm text-[#22D3EE]">{m.formula}</code>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#0F172A] px-3 py-2 text-center">
      <div className="text-[10px] text-[#6B7280]">{label}</div>
      <div className="text-sm font-bold text-[#E6EDF3]">{value}</div>
    </div>
  );
}

function AnalysisTab() {
  const [comparePage, setComparePage] = useState(false);
  const [selectedRun, setSelectedRun] = useState<number>(mpoxBestRun.run);
  const metricLeaders = useMemo(() => {
    return MPOX_METRICS.map((m) => {
      const best = mpoxRuns.reduce((a, b) => (m.pick(b) > m.pick(a) ? b : a));
      return { ...m, best };
    });
  }, []);
  const selected = mpoxRuns.find((r) => r.run === selectedRun) ?? mpoxBestRun;
  if (comparePage) return <ComparePaperPage onBack={() => setComparePage(false)} />;
  return (
    <div>
      <SectionHeader title={mpoxUi.analysis.title} />
      <div className="mb-6">
        <button onClick={() => setComparePage(true)} className="inline-flex items-center gap-2 rounded-lg border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 px-4 py-2 text-sm font-semibold text-[#C4B5FD]">
          <FaFlask className="text-xs" />{mpoxUi.analysis.compareBtn}
        </button>
      </div>

      <div className="mb-8 rounded-3xl border border-emerald-400/30 bg-emerald-400/5 p-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs font-bold text-emerald-300">{mpoxUi.analysis.overallBestRow}</span>
          <span className="text-lg font-bold text-[#E6EDF3]">Run {mpoxBestRun.run}</span>
          <span className="text-sm text-[#9CA3AF]">Test Acc {mpoxBestRun.testAcc.toFixed(2)}%</span>
        </div>
        <button type="button" onClick={() => setSelectedRun(mpoxBestRun.run)}
          className="text-sm font-semibold text-[#22D3EE] hover:underline">{mpoxUi.analysis.viewRunDetail}</button>
      </div>

      <h3 className="mb-2 text-lg font-black text-[#E6EDF3]">{mpoxUi.analysis.metricLeadersTitle}</h3>
      <p className="mb-4 text-sm text-[#9CA3AF]">{mpoxUi.analysis.metricLeadersHint}</p>
      <div className="mb-8 overflow-x-auto rounded-2xl border border-[#1F2937]">
        <table className="w-full border-collapse text-sm">
          <thead><tr className="bg-[#0F172A] text-left text-[#9CA3AF]">
            <th className="px-4 py-3">{mpoxUi.analysis.colItem}</th>
            <th className="px-4 py-3">{mpoxUi.analysis.colMetric}</th>
            <th className="px-4 py-3">最佳 Run</th>
            <th className="px-4 py-3 text-right">數值</th>
          </tr></thead>
          <tbody>
            {metricLeaders.map((row, i) => {
              const isOverall = row.key === "testAcc";
              return (
                <tr key={row.key}
                  onClick={() => setSelectedRun(row.best.run)}
                  className={`cursor-pointer border-t border-[#1F2937] transition hover:bg-[#1F2937]/50 ${isOverall ? "bg-emerald-500/10" : ""} ${selectedRun === row.best.run ? "ring-1 ring-inset ring-[#8B5CF6]/50" : ""}`}>
                  <td className="px-4 py-3 text-[#6B7280]">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-[#C4B5FD]">{row.label}{isOverall && <span className="ml-2 text-[10px] text-emerald-300">綜合</span>}</td>
                  <td className="px-4 py-3 font-mono text-[#E6EDF3]">Run {row.best.run}</td>
                  <td className="px-4 py-3 text-right font-bold text-[#22D3EE]">{row.fmt(row.pick(row.best))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ResultCard title={mpoxUi.analysis.avg10Title} data={mpoxAverage10} badge={`最佳 Run ${mpoxBestRun.run}`} />
        <ResultCard title={mpoxUi.analysis.avg500Title} data={mpoxAverage500} />
      </div>

      <section className="mt-4 rounded-2xl border border-[#1F2937] bg-[#111827] p-5">
        <h3 className="mb-4 text-lg font-black text-[#E6EDF3]">Run {selected.run} 詳細指標</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label="Train Acc" value={`${selected.trainAcc}%`} />
          <Metric label="Test Acc" value={`${selected.testAcc.toFixed(2)}%`} />
          <Metric label="AUC" value={selected.auc.toFixed(4)} />
          <Metric label="F1" value={selected.f1.toFixed(4)} />
          <Metric label="Precision" value={selected.precision.toFixed(4)} />
          <Metric label="Recall" value={selected.recall.toFixed(4)} />
          <Metric label="Loss" value={selected.loss.toFixed(4)} />
          <Metric label="Batch/LR/Ep" value={`${selected.batchSize}/${selected.lr}/${selected.epochs}`} />
        </div>
      </section>

      <MpoxConfusionSection run={selectedRun} />
    </div>
  );
}

function MpoxConfusionSection({ run }: { run: number }) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const src = "/mpox/confusion_matrix_best.png";
  useEffect(() => {
    setState("loading");
  }, [run]);
  return (
    <section className="mt-8">
      <h3 className="mb-4 text-lg font-black text-[#E6EDF3]">{mpoxUi.analysis.confusionTitle}（Run {run}）</h3>
      <div className="overflow-hidden rounded-2xl border border-[#1F2937] bg-[#111827] p-4">
        {state === "loading" && <p className="py-8 text-center text-sm text-[#6B7280]">{mpoxUi.analysis.confusionLoading}</p>}
        {state === "error" && <p className="py-8 text-center text-sm text-[#9CA3AF]">{mpoxUi.analysis.confusionMissing}</p>}
        <img
          src={src}
          alt="混淆矩陣"
          className={`mx-auto max-h-[420px] w-full object-contain ${state === "ok" ? "block" : "hidden"}`}
          onLoad={() => setState("ok")}
          onError={() => setState("error")}
        />
      </div>
    </section>
  );
}

function ResultCard({ title, data, badge }: { title: string; data: typeof mpoxAverage10; badge?: string }) {
  return (
    <div className="rounded-2xl border border-[#1F2937] bg-[#111827] p-5">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="font-bold text-[#E6EDF3]">{title}</h3>
        {badge && <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] text-emerald-300">{badge}</span>}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Metric label="Test Acc" value={`${data.testAcc}%`} />
        <Metric label="AUC" value={String(data.auc)} />
        <Metric label="Precision" value={String(data.precision)} />
        <Metric label="Recall" value={String(data.recall)} />
        <Metric label="F1" value={String(data.f1)} />
        <Metric label="Loss" value={String(data.loss)} />
      </div>
    </div>
  );
}

function ComparePaperPage({ onBack }: { onBack: () => void }) {
  const [showSummary, setShowSummary] = useState(false);
  const b = mpoxBenchmark;
  const paramBarData = b.paramCompare.map((p) => ({
    name: p.method.includes("Ours") ? "Ours" : "PoxNet22",
    accuracy: p.accuracy === "—" ? 0 : Number(p.accuracy),
    paramsM: p.paramsNum,
    isOurs: p.method.includes("Ours"),
    hasAcc: p.accuracy !== "—",
  }));
  const accData = paramBarData.filter((d) => d.hasAcc);
  const maxAcc = Math.max(...accData.map((d) => d.accuracy), 96.776);
  const maxParam = Math.max(...paramBarData.map((d) => d.paramsM));

  return (
    <div>
      <button onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-sm text-[#9CA3AF] hover:text-[#E6EDF3]"><FaChevronLeft className="text-xs" />{mpoxUi.analysis.backToAnalysis}</button>
      <h1 className="text-3xl font-black md:text-4xl">{mpoxUi.analysis.compareTitle}</h1>
      <p className="mt-3 max-w-3xl text-base leading-8 text-[#BFD2EA]">
        本研究以 MobileNet-V2 + Adam 進行猴痘二分類，以下與 PoxNet22 論文基準比較。
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InfoPill label={mpoxUi.analysis.pillAuthor} value={b.authors} large />
        <InfoPill label={mpoxUi.analysis.pillJournal} value={b.journal} large />
        <InfoPill label={mpoxUi.analysis.pillRank} value={b.rank} large />
      </div>
      <a href={b.doi} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#1F2937] bg-[#111827] px-3 py-2 text-sm text-[#22D3EE]"><FaExternalLinkAlt className="text-[10px]" /> DOI</a>

      <button type="button" onClick={() => setShowSummary((s) => !s)}
        className="mt-8 text-left text-base font-semibold text-[#C4B5FD] underline decoration-[#8B5CF6]/50 underline-offset-4 transition hover:text-[#E6EDF3]">
        {showSummary ? "收合論文摘要" : "展開論文摘要（中文）"}
      </button>
      {showSummary && (
        <div className="mt-4 max-w-4xl rounded-2xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 p-6">
          <h3 className="text-base font-bold text-[#C4B5FD]">{b.paper}</h3>
          <p className="mt-4 text-lg leading-9 text-[#E6EDF3]">{b.paperSummary}</p>
        </div>
      )}

      <h2 className="mb-4 mt-10 text-xl font-black text-[#E6EDF3]">關鍵指標對比</h2>
      <div className="overflow-x-auto rounded-2xl border border-[#1F2937]">
        <table className="w-full border-collapse text-sm">
          <thead><tr className="bg-[#0F172A] text-left text-[#9CA3AF]">
            <th className="px-4 py-3">{mpoxUi.analysis.colItem}</th>
            <th className="px-4 py-3">{mpoxUi.analysis.colMetric}</th>
            <th className="px-4 py-3 text-right">{mpoxUi.analysis.colPaper}</th>
            <th className="px-4 py-3 text-right text-emerald-300">{mpoxUi.analysis.colOurs}</th>
            <th className="px-4 py-3">{mpoxUi.analysis.colConclusion}</th>
          </tr></thead>
          <tbody>{b.rows.map((r, i) => (
            <tr key={r.metric} className="border-t border-[#1F2937]">
              <td className="px-4 py-3 text-[#6B7280]">{i + 1}</td>
              <td className="px-4 py-3 font-semibold text-[#E6EDF3]">{r.metric}</td>
              <td className="px-4 py-3 text-right text-[#9CA3AF]">{r.paper}</td>
              <td className="px-4 py-3 text-right font-semibold text-emerald-300">{r.ours}</td>
              <td className="px-4 py-3 text-[#9CA3AF]">{r.note}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <h3 className="mb-4 mt-10 text-xl font-black text-[#E6EDF3]">{mpoxUi.analysis.paramChartTitle}</h3>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#1F2937] bg-[#111827] p-5">
          <h4 className="mb-4 text-sm font-bold text-[#9CA3AF]">Test Accuracy 對比（越高越好）</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accData} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" horizontal={false} />
                <XAxis type="number" domain={[90, maxAcc * 1.02]} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={72} tick={{ fill: "#E6EDF3", fontSize: 13 }} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1F2937" }} />
                <Bar dataKey="accuracy" radius={[0, 6, 6, 0]} barSize={28}>
                  {accData.map((d) => (
                    <Cell key={d.name} fill={d.isOurs ? "#34d399" : "#8B5CF6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-[#1F2937] bg-[#111827] p-5">
          <h4 className="mb-4 text-sm font-bold text-[#9CA3AF]">參數量對比（M，越低越輕量）</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paramBarData} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" horizontal={false} />
                <XAxis type="number" domain={[0, maxParam * 1.1]} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={72} tick={{ fill: "#E6EDF3", fontSize: 13 }} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1F2937" }} />
                <Bar dataKey="paramsM" radius={[0, 6, 6, 0]} barSize={28}>
                  {paramBarData.map((d) => (
                    <Cell key={d.name} fill={d.isOurs ? "#22D3EE" : "#6B7280"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <h3 className="mb-4 mt-10 text-xl font-black text-[#E6EDF3]">{mpoxUi.analysis.augTitle}</h3>
      <div className="rounded-3xl border-2 border-[#8B5CF6]/40 bg-gradient-to-br from-[#1E1B4B]/80 to-[#111827] p-8 md:p-10">
        <p className="text-xl leading-10 text-[#E6EDF3] md:text-2xl">
          <span className="font-bold text-[#C4B5FD]">論文基準使用了：</span>
          {b.augmentationCompare[0].paper}
        </p>
        <p className="mt-8 text-xl font-bold leading-10 text-emerald-300 md:text-2xl">
          <span className="text-[#E6EDF3]">本研究：</span>
          {b.augmentationCompare[0].ours}
        </p>
      </div>
      <p className="mt-6 max-w-3xl text-base leading-8 text-[#BFD2EA]">{b.conclusion}</p>
    </div>
  );
}

function InfoPill({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return (
    <div className="rounded-xl border border-[#1F2937] bg-[#111827] px-5 py-4">
      <div className={`uppercase tracking-widest text-[#6B7280] ${large ? "text-sm" : "text-[10px]"}`}>{label}</div>
      <div className={`mt-2 text-[#E6EDF3] ${large ? "text-lg font-bold leading-7 md:text-xl" : "text-sm"}`}>{value}</div>
    </div>
  );
}
