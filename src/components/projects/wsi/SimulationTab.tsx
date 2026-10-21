"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SectionHeader } from "@/components/projects/shared/SectionHeader";
import { useTrainingStatus } from "@/components/projects/shared/useTrainingStatus";
import { useGdriveExperiments } from "@/components/projects/wsi/GdriveExperimentsContext";
import { useMergedWsiData } from "@/components/projects/wsi/useMergedWsiData";
import { hpSummary, pickDriveFolderId } from "@/components/projects/wsi/wsiDashboardUtils";
import {
  CollapsibleSection,
  ExpAccordionItem,
  WsiStatBox,
} from "@/components/projects/wsi/shared/WsiLayoutParts";
import {
  ExpConfusionSection,
  ExpTrainingChartSection,
  HyperparamGridTable,
  HyperparamPanel,
} from "@/components/projects/wsi/experiment/ExperimentPanels";
import { simulationExpOrder, totalConfigsPlanned, getRootExperimentMeta } from "@/lib/wsiRootExperiments";
import { localConfusionForExp } from "@/components/projects/wsi/wsiDashboardUtils";
import { wsiUi, fmtMetric } from "@/lib/wsiUiLabels";
import { LargeScalePanel } from "@/components/projects/wsi/LargeScalePanel";
import { largeScaleRunTotal } from "@/lib/wsiLargeScale";

function expSerial(id: number) {
  return `${wsiUi.simulation.expSerial} ${String(id).padStart(2, "0")}`;
}

export function SimulationTab() {
  const status = useTrainingStatus();
  const [scaleMode, setScaleMode] = useState<"small" | "large">("small");
  const [openExp, setOpenExp] = useState<number | null>(null);
  const expRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const gdrive = useGdriveExperiments();
  const { cloudFolders, mergedConfigs: byId, folderByExp, effectiveBest } = useMergedWsiData(gdrive);
  const uniqueFolderExpCount = useMemo(
    () => new Set(cloudFolders.map((f) => f.expId)).size,
    [cloudFolders],
  );
  useEffect(() => {
    if (!gdrive?.connected) return;
    const links: HTMLLinkElement[] = [];
    for (const id of simulationExpOrder()) {
      const cfg = byId.get(id);
      const folders = folderByExp.get(id);
      const folderId = pickDriveFolderId(id, cfg, folders);
      const rootMeta = getRootExperimentMeta(id);
      const summaryFile =
        rootMeta && "summaryChartFile" in rootMeta ? rootMeta.summaryChartFile : undefined;
      const summaryRootId =
        rootMeta && "summaryChartRootId" in rootMeta ? rootMeta.summaryChartRootId : undefined;
      const run1Summary =
        !!(rootMeta && "run1SummaryChart" in rootMeta && rootMeta.run1SummaryChart);
      let href = "";
      if (run1Summary && summaryRootId && summaryFile) {
        href = `/api/gdrive/drive-image?rootFolderId=${encodeURIComponent(summaryRootId)}&fileName=${encodeURIComponent(summaryFile)}`;
      } else if (folderId) {
        href = `/api/gdrive/training-chart?folderId=${encodeURIComponent(folderId)}&run=run1`;
      }
      if (!href) continue;
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.as = "image";
      link.href = href;
      document.head.appendChild(link);
      links.push(link);
    }
    return () => {
      links.forEach((l) => document.head.removeChild(l));
    };
  }, [gdrive?.connected, byId, folderByExp]);

  const isLive = status?.connected && status.status === "running";

  const jumpToExp = (id: number) => {
    setOpenExp(id);
    requestAnimationFrame(() => {
      expRefs.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  return (
    <div>
      <SectionHeader title={wsiUi.simulation.title} />
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setScaleMode("small")}
          className={`rounded-2xl border px-5 py-4 text-left transition ${
            scaleMode === "small"
              ? "border-[#8B5CF6] bg-[#8B5CF6]/15"
              : "border-[#1F2937] bg-[#111827] hover:border-[#8B5CF6]/40"
          }`}
        >
          <div className="text-lg font-black text-[#E6EDF3]">小規模</div>
          <p className="mt-1 text-sm text-[#9CA3AF]">目前這組：50 組超參數，每組 10 runs</p>
        </button>
        <button
          type="button"
          onClick={() => setScaleMode("large")}
          className={`rounded-2xl border px-5 py-4 text-left transition ${
            scaleMode === "large"
              ? "border-[#8B5CF6] bg-[#8B5CF6]/15"
              : "border-[#1F2937] bg-[#111827] hover:border-[#8B5CF6]/40"
          }`}
        >
          <div className="text-lg font-black text-[#E6EDF3]">大規模</div>
          <p className="mt-1 text-sm text-[#9CA3AF]">目前 {largeScaleRunTotal} 次</p>
        </button>
      </div>
      {scaleMode === "large" ? (
        <div className="rounded-2xl border border-[#8B5CF6]/30 bg-[#111827] p-6 md:p-8">
          <LargeScalePanel />
        </div>
      ) : (
      <>
      <div className="mb-6 min-h-[220px] rounded-2xl border border-[#1F2937] bg-black p-6">
        {isLive ? (
          <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
            <div className="mb-2 flex items-center gap-2 text-base text-emerald-400">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
              {wsiUi.simulation.liveTitle} · {status!.machine}
            </div>
            <div className="font-mono text-4xl font-black tracking-wide text-white md:text-5xl">
              Run {status!.run} / {status!.totalRuns}
            </div>
            <div className="mt-2 font-mono text-3xl font-bold text-[#22D3EE] md:text-4xl">
              Epoch {status!.epoch} / {status!.totalEpochs}
            </div>
            <div className="mt-6 h-2 w-full max-w-xl overflow-hidden rounded-full bg-[#1F2937]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE]"
                style={{ width: `${Math.min(100, (status!.epoch / Math.max(status!.totalEpochs, 1)) * 100)}%` }} />
            </div>
            <p className="mt-3 text-sm text-[#9CA3AF]">{status!.currentConfig} · {status!.framework}</p>
          </div>
        ) : (
          <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
            <p className="flex items-center justify-center gap-2 text-base text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
              {wsiUi.simulation.idleConnected}
            </p>
            <p className="mt-4 font-mono text-4xl font-black tracking-wide text-[#9CA3AF] md:text-5xl">
              {wsiUi.simulation.idleNotRunning}
            </p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#9CA3AF]">
              {status?.note || wsiUi.simulation.idleOfflineHint}
            </p>
          </div>
        )}
      </div>

      <div className="mb-6 rounded-2xl border border-[#1F2937] bg-[#0F172A] p-5">
        <h3 className="mb-4 text-lg font-bold text-[#E6EDF3]">{wsiUi.simulation.envTitle}</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-4">
            <div className="text-sm text-[#9CA3AF]">{wsiUi.simulation.envFramework}</div>
            <div className="mt-1 text-base font-semibold text-[#E6EDF3]">{wsiUi.simulation.envFrameworkValue}</div>
          </div>
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-4">
            <div className="text-sm text-[#9CA3AF]">{wsiUi.simulation.envModel}</div>
            <div className="mt-1 text-base font-semibold text-[#E6EDF3]">{wsiUi.simulation.envModelValue}</div>
          </div>
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-4">
            <div className="text-sm text-[#9CA3AF]">{wsiUi.simulation.envGpu}</div>
            <div className="mt-1 text-base font-semibold text-[#E6EDF3]">{wsiUi.simulation.envGpuValue}</div>
          </div>
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-4">
            <div className="text-sm text-[#9CA3AF]">{wsiUi.simulation.envHost}</div>
            <div className="mt-1 text-base font-semibold text-[#E6EDF3]">{wsiUi.simulation.envHostValue}</div>
          </div>
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-4">
            <div className="text-sm text-[#9CA3AF]">{wsiUi.simulation.envParams}</div>
            <div className="mt-1 text-base font-semibold text-[#E6EDF3]">{wsiUi.simulation.envParamsValue}</div>
          </div>
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-4">
            <div className="text-sm text-[#9CA3AF]">{wsiUi.simulation.envData}</div>
            <div className="mt-1 text-base font-semibold text-[#E6EDF3]">{wsiUi.simulation.envDataValue}</div>
          </div>
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-4 sm:col-span-2 lg:col-span-3">
            <div className="text-sm text-[#9CA3AF]">{wsiUi.simulation.envRuns}</div>
            <div className="mt-1 text-base font-semibold text-[#E6EDF3]">{wsiUi.simulation.envRunsValue}</div>
            <p className="mt-2 text-sm text-[#9CA3AF]">
              最佳：實驗序號 49（Exp451 / LeakyReLU）· 對照：50（Exp450）
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-7 text-[#9CA3AF]">{wsiUi.simulation.envNote}</p>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <WsiStatBox
          value={`${uniqueFolderExpCount} / ${totalConfigsPlanned}`}
          label={wsiUi.simulation.configsDoneDetail}
        />
        <WsiStatBox
          value={wsiUi.simulation.runsPerConfigValue}
          label={wsiUi.simulation.runsPerConfigLabel}
        />
        <WsiStatBox
          value={`mPQ+ ${fmtMetric(effectiveBest.mPQ)}`}
          label={`${wsiUi.simulation.bestConfig} · ${expSerial(effectiveBest.expId)}`}
          onClick={() => jumpToExp(effectiveBest.expId)}
          variant="best"
        />
      </div>
      <div className="mb-6">
        <CollapsibleSection title={wsiUi.simulation.expReasonTitle}>
          <p className="text-base leading-8 text-[#BFD2EA]">{wsiUi.simulation.expReasonBody}</p>
          <HyperparamGridTable />
        </CollapsibleSection>
      </div>
      <div className="space-y-3">{simulationExpOrder().map((id) => {
        const cfg = byId.get(id);
        const isBest = id === effectiveBest.expId;
        const isOpen = openExp === id;
        const folders = folderByExp.get(id);
        const driveFolderId = pickDriveFolderId(id, cfg, folders);
        return (
          <div
            key={id}
            ref={(el) => { expRefs.current.set(id, el); }}
            className={`rounded-xl border ${isBest ? "border-emerald-400/40 bg-emerald-400/5" : cfg ? "border-[#1F2937] bg-[#111827]" : "border-[#1F2937]/60 bg-[#0B0F14]"}`}
          >
            <button type="button" onClick={() => cfg && setOpenExp(isOpen ? null : id)}
              className={`flex w-full flex-col gap-2 px-4 py-4 text-left ${cfg ? "hover:bg-[#1F2937]/30" : "cursor-default"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-bold text-[#E6EDF3]">{expSerial(id)}</span>
                {isBest && <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs font-bold text-emerald-300">{wsiUi.simulation.bestBadge}</span>}
              </div>
              {cfg ? (
                <>
                  <div className="text-base text-[#BFD2EA]">StarDist + AdamW · mPQ+ {fmtMetric(cfg.mPQ)}</div>
                  <div className="font-mono text-sm leading-6 text-[#9CA3AF]">{hpSummary(cfg)}</div>
                </>
              ) : (
                <span className="text-base text-[#6B7280]">{wsiUi.simulation.pendingConfig}</span>
              )}
            </button>
            {cfg && isOpen && (
              <div className="space-y-2 border-t border-[#1F2937] px-4 pb-4 pt-3">
                <ExpAccordionItem title={wsiUi.simulation.simulationHpTitle}>
                  <HyperparamPanel cfg={cfg} bare />
                </ExpAccordionItem>
                <ExpAccordionItem title={`${wsiUi.analysis.trainingChartTitle} — ${expSerial(id)}`}>
                  <ExpTrainingChartSection expId={id} folderId={driveFolderId} inline bare />
                </ExpAccordionItem>
                <ExpAccordionItem title={`${wsiUi.analysis.confusionTitle} — ${expSerial(id)}`}>
                  <ExpConfusionSection
                    expId={id}
                    folderId={driveFolderId}
                    localMatrix={cfg.confusion ?? localConfusionForExp(id)}
                    inline
                    bare
                  />
                </ExpAccordionItem>
              </div>
            )}
          </div>
        );
      })}</div>
      </>
      )}
    </div>
  );
}
