"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { getRootExperimentMeta } from "@/lib/wsiRootExperiments";
import type { ConfusionMatrix, WsiConfig } from "@/lib/wsiResults";
import { wsiUi, fmtMetric } from "@/lib/wsiUiLabels";
import { hpDisplay, localConfusionForExp } from "@/components/projects/wsi/wsiDashboardUtils";

export function ExpTrainingChartSection({
  expId,
  folderId,
  inline,
  bare,
}: {
  expId: number;
  folderId?: string;
  inline?: boolean;
  bare?: boolean;
}) {
  const rootMeta = getRootExperimentMeta(expId);
  const summaryFile =
    rootMeta && "summaryChartFile" in rootMeta ? rootMeta.summaryChartFile : undefined;
  const summaryRootId =
    rootMeta && "summaryChartRootId" in rootMeta ? rootMeta.summaryChartRootId : undefined;
  const run1UsesSummary =
    !!(rootMeta && "run1SummaryChart" in rootMeta && rootMeta.run1SummaryChart);

  const [runs, setRuns] = useState<string[]>([]);
  const [tab, setTab] = useState<string>("run1");
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!folderId) return;
    let alive = true;
    fetch(`/api/gdrive/training-runs?folderId=${encodeURIComponent(folderId)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { runs?: string[] }) => {
        if (!alive) return;
        const list =
          d.runs?.length ? d.runs : Array.from({ length: 10 }, (_, i) => `run${i + 1}`);
        setRuns(list);
      })
      .catch(() => {
        if (alive) {
          setRuns(Array.from({ length: 10 }, (_, i) => `run${i + 1}`));
        }
      });
    return () => {
      alive = false;
    };
  }, [folderId]);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [expId, folderId, tab, retry]);

  const imgSrc = useMemo(() => {
    if (tab === "run1" && run1UsesSummary && summaryRootId && summaryFile) {
      return `/api/gdrive/drive-image?rootFolderId=${encodeURIComponent(summaryRootId)}&fileName=${encodeURIComponent(summaryFile)}&t=${retry}`;
    }
    if (!folderId) return "";
    return `/api/gdrive/training-chart?folderId=${encodeURIComponent(folderId)}&run=${encodeURIComponent(tab)}&t=${retry}`;
  }, [tab, run1UsesSummary, summaryRootId, summaryFile, folderId, retry]);

  useEffect(() => {
    if (!imgSrc) return;
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "image";
    link.href = imgSrc;
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [imgSrc]);

  const sectionClass = bare
    ? ""
    : inline
      ? "mt-4 rounded-xl border border-[#1F2937] bg-[#0F172A] p-4"
      : "mt-6 rounded-2xl border border-[#1F2937] bg-[#111827] p-5";

  if (!folderId && !(run1UsesSummary && summaryRootId && summaryFile)) {
    const empty = (
      <>
        {!bare && (
          <h4 className="mb-2 text-base font-bold text-[#E6EDF3]">
            {wsiUi.analysis.trainingChartTitle} — exp_{String(expId).padStart(2, "0")}
          </h4>
        )}
        <p className="text-sm text-[#9CA3AF]">此配置尚無雲端成果資料夾。</p>
      </>
    );
    return bare ? <div>{empty}</div> : <section className={sectionClass}>{empty}</section>;
  }

  const tabs = runs.map((r) => ({ key: r, label: `${wsiUi.analysis.trainingChartRun} ${r.replace(/^run/i, "")}` }));

  const chartBody = (
    <>
      {!bare && (
        <h4 className="mb-3 text-base font-bold text-[#E6EDF3]">
          {wsiUi.analysis.trainingChartTitle} — exp_{String(expId).padStart(2, "0")}
        </h4>
      )}
      {tabs.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                tab === t.key
                  ? "bg-[#22D3EE]/20 text-[#22D3EE]"
                  : "bg-[#1F2937] text-[#9CA3AF] hover:text-[#E6EDF3]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      {!loaded && !failed && imgSrc && (
        <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#22D3EE] border-t-transparent" />
          {wsiUi.analysis.trainingChartLoading}
        </div>
      )}
      {failed && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-amber-400/90">{wsiUi.analysis.trainingChartMissing}</p>
          <button
            type="button"
            onClick={() => setRetry((n) => n + 1)}
            className="rounded-lg border border-[#22D3EE]/40 px-3 py-1 text-xs font-semibold text-[#22D3EE] hover:bg-[#22D3EE]/10"
          >
            重新載入
          </button>
        </div>
      )}
      {imgSrc && (
        <div className={`overflow-hidden rounded-xl border border-[#0F172A] bg-black ${loaded && !failed ? "block" : "hidden"}`}>
          <button type="button" onClick={() => setLightbox(imgSrc)} className="block w-full cursor-zoom-in">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt={`exp_${String(expId).padStart(2, "0")} training curve`}
              className="w-full"
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
            />
          </button>
        </div>
      )}
      {lightbox && (
        <ImageLightbox
          src={lightbox}
          alt={`exp_${String(expId).padStart(2, "0")} training chart`}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );

  if (bare) return <div>{chartBody}</div>;
  return <section className={sectionClass}>{chartBody}</section>;
}

export function ExpResultEvidence({
  expId,
  folderId,
  localMatrix,
  inline,
}: {
  expId: number;
  folderId?: string;
  localMatrix?: ConfusionMatrix | null;
  inline?: boolean;
}) {
  return (
    <>
      <ExpTrainingChartSection expId={expId} folderId={folderId} inline={inline} />
      <ExpConfusionSection expId={expId} folderId={folderId} localMatrix={localMatrix} inline={inline} />
    </>
  );
}

export function ExpConfusionSection({
  expId,
  folderId,
  localMatrix,
  inline,
  bare,
}: {
  expId: number;
  folderId?: string;
  localMatrix?: ConfusionMatrix | null;
  inline?: boolean;
  bare?: boolean;
}) {
  const embedded = localMatrix ?? localConfusionForExp(expId);
  const [runs, setRuns] = useState<string[]>([]);
  const [run, setRun] = useState("run1");
  const [matrix, setMatrix] = useState<ConfusionMatrix | null>(embedded);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (embedded || !folderId) return;
    let alive = true;
    fetch(`/api/gdrive/training-runs?folderId=${encodeURIComponent(folderId)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { runs?: string[] }) => {
        if (!alive) return;
        const list =
          d.runs?.length ? d.runs : Array.from({ length: 10 }, (_, i) => `run${i + 1}`);
        setRuns(list);
        if (list[0]) setRun(list[0]);
      })
      .catch(() => {
        if (alive) setRuns(Array.from({ length: 10 }, (_, i) => `run${i + 1}`));
      });
    return () => {
      alive = false;
    };
  }, [folderId, embedded]);

  useEffect(() => {
    if (embedded) {
      setMatrix(embedded);
      setError(null);
      setLoading(false);
      return;
    }
    if (!folderId) {
      setMatrix(null);
      setError("此配置尚無混淆矩陣資料。");
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    fetch(
      `/api/gdrive/confusion?folderId=${encodeURIComponent(folderId)}&run=${encodeURIComponent(run)}`,
      { cache: "no-store" },
    )
      .then(async (res) => {
        const data = (await res.json()) as { ok?: boolean; confusion?: ConfusionMatrix; error?: string };
        if (!alive) return;
        if (data.confusion) setMatrix(data.confusion);
        else {
          const local = localConfusionForExp(expId);
          if (local) setMatrix(local);
          else setError(data.error ?? "無法載入混淆矩陣");
        }
      })
      .catch(() => {
        if (alive) {
          const local = localConfusionForExp(expId);
          if (local) setMatrix(local);
          else setError("連線失敗，請稍後再試");
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [expId, folderId, embedded, run]);

  const sectionClass = bare
    ? ""
    : inline
      ? "mt-4 rounded-xl border border-[#1F2937] bg-[#0F172A] p-4"
      : "mt-6 rounded-2xl border border-[#1F2937] bg-[#111827] p-5";

  const body = (
    <>
      {!bare && (
        <h4 className="mb-3 text-base font-bold text-[#E6EDF3]">
          {wsiUi.analysis.confusionTitle} — exp_{String(expId).padStart(2, "0")}
          {embedded && <span className="ml-2 text-xs font-normal text-emerald-400">（本地資料）</span>}
        </h4>
      )}
      {!embedded && runs.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {runs.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRun(r)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                run === r
                  ? "bg-[#8B5CF6]/20 text-[#C4B5FD]"
                  : "bg-[#1F2937] text-[#9CA3AF] hover:text-[#E6EDF3]"
              }`}
            >
              {wsiUi.analysis.trainingChartRun} {r.replace(/^run/i, "")}
            </button>
          ))}
        </div>
      )}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#8B5CF6] border-t-transparent" />
          載入混淆矩陣…
        </div>
      )}
      {error && !loading && !matrix && <p className="text-sm text-amber-400/90">{error}</p>}
      {matrix && !loading && <ConfusionMatrixView matrix={matrix} />}
    </>
  );

  if (bare) return <div>{body}</div>;
  return <section className={sectionClass}>{body}</section>;
}

export function HyperparamPanel({ cfg, bare }: { cfg: WsiConfig & { source?: string }; bare?: boolean }) {
  const rows = [
    { label: "unet_n_filter_base", value: hpDisplay(cfg.filterBase) },
    { label: "net_conv_after_unet", value: hpDisplay(cfg.convAfter) },
    { label: "head_blocks", value: hpDisplay(cfg.headBlocks) },
    { label: "train_learning_rate", value: hpDisplay(cfg.lr) },
    { label: "train_loss_weights", value: hpDisplay(cfg.lossWeights) },
    { label: "n_rays", value: "32" },
    { label: "train_epochs", value: "50" },
    { label: "train_batch_size", value: "4" },
  ].filter((r) => r.value !== "—");
  const grid = (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((r) => (
        <div key={r.label} className="rounded-lg bg-[#111827] px-3 py-2">
          <div className="font-mono text-[10px] text-[#6B7280]">{r.label}</div>
          <div className="mt-0.5 text-sm font-semibold text-[#E6EDF3]">{r.value}</div>
        </div>
      ))}
    </div>
  );
  if (bare) return grid;
  return (
    <div className="mt-3 rounded-xl border border-[#22D3EE]/20 bg-[#0F172A] p-4">
      <h4 className="mb-3 text-sm font-bold text-[#22D3EE]">{wsiUi.simulation.simulationHpTitle}</h4>
      {grid}
    </div>
  );
}

export const HYPERPARAM_GRID_ROWS = [
  { cat: "網路架構", name: "unet_n_filter_base", desc: "U-Net 起始 filter 數（越大模型越寬）", values: "32、64" },
  { cat: "網路架構", name: "net_conv_after_unet", desc: "U-Net 後額外卷積通道數", values: "128、256" },
  { cat: "網路架構", name: "head_blocks", desc: "輸出頭卷積區塊數", values: "1、2" },
  { cat: "優化器", name: "train_learning_rate", desc: "學習率", values: "3e-4、1e-4" },
  {
    cat: "訓練",
    name: "train_loss_weights",
    desc: "機率／距離／類別 loss 權重",
    values: "(1.0, 0.2, 1.0)、(1.0, 0.2, 5.0)、(1.0, 0.2, 10.0)",
  },
];

export function HyperparamGridTable() {
  return (
    <div className="mt-5 overflow-x-auto rounded-xl border border-[#1F2937]">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[#0F172A] text-left text-[#9CA3AF]">
            <th className="w-14 px-4 py-3">編號</th>
            <th className="px-4 py-3">類別</th>
            <th className="px-4 py-3">超參數</th>
            <th className="px-4 py-3">說明</th>
            <th className="px-4 py-3">候選值</th>
          </tr>
        </thead>
        <tbody>
          {HYPERPARAM_GRID_ROWS.map((r, i) => (
            <tr key={r.name} className="border-t border-[#1F2937]">
              <td className="px-4 py-3 text-[#6B7280]">{i + 1}</td>
              <td className="whitespace-nowrap px-4 py-3 text-[#C4B5FD]">{r.cat}</td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-[#22D3EE]">{r.name}</td>
              <td className="px-4 py-3 text-[#BFD2EA]">{r.desc}</td>
              <td className="px-4 py-3 font-mono text-[#E6EDF3]">{r.values}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-[#1F2937] px-4 py-3 text-xs leading-6 text-[#6B7280]">
        共 50 組配置；每組以隨機切分獨立重跑 10 次。
      </p>
    </div>
  );
}

function ConfusionMatrixView({ matrix }: { matrix: NonNullable<WsiConfig["confusion"]> }) {
  const cellColor = (v: number) => `rgba(34, 211, 238, ${Math.max(0.08, v)})`;
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#1F2937]">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-[#0F172A] text-[#9CA3AF]">
            <th className="px-3 py-2">實際 \ 預測</th>
            {matrix.labels.map((l) => <th key={l} className="px-3 py-2 text-center">{l}</th>)}
          </tr>
        </thead>
        <tbody>
          {matrix.rows.map((row) => (
            <tr key={row.label} className="border-t border-[#1F2937]">
              <td className="px-3 py-2 font-semibold text-[#E6EDF3]">{row.label}</td>
              {row.values.map((v, i) => (
                <td key={i} className="px-3 py-2 text-center font-mono text-[#E6EDF3]" style={{ backgroundColor: cellColor(v) }}>
                  {(v * 100).toFixed(1)}%
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
