"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { FaFlask, FaMicroscope, FaRobot } from "react-icons/fa";
import { SectionHeader } from "@/components/projects/shared/SectionHeader";
import { useGdriveExperiments } from "@/components/projects/wsi/GdriveExperimentsContext";
import { useMergedWsiData } from "@/components/projects/wsi/useMergedWsiData";
import { wsiUi } from "@/lib/wsiUiLabels";
import { LargeScalePanel } from "@/components/projects/wsi/LargeScalePanel";
import { largeScaleRunTotal } from "@/lib/wsiLargeScale";
import { wsiLizardRootFolderId } from "@/lib/wsiRootExperiments";

const ComparePaperPage = dynamic(
  () => import("@/components/projects/wsi/ComparePaperPage").then((m) => m.ComparePaperPage),
  { ssr: false },
);
const MetricGlossaryPage = dynamic(
  () => import("@/components/projects/wsi/MetricGlossaryPage").then((m) => m.MetricGlossaryPage),
  { ssr: false },
);
const ResultsOverviewPage = dynamic(
  () => import("@/components/projects/wsi/ResultsOverviewPage").then((m) => m.ResultsOverviewPage),
  { ssr: false },
);
const AiSuggestPage = dynamic(
  () => import("@/components/projects/wsi/AiSuggestPage").then((m) => m.AiSuggestPage),
  { ssr: false },
);
const PrecisionRecallPage = dynamic(
  () => import("@/components/projects/wsi/PrecisionRecallPage").then((m) => m.PrecisionRecallPage),
  { ssr: false },
);

type AnalysisView =
  | "hub"
  | "compare"
  | "metrics"
  | "overview"
  | "overviewLarge"
  | "ai"
  | "precision";

export function AnalysisTab() {
  const [view, setView] = useState<AnalysisView>("hub");
  const gdrive = useGdriveExperiments();
  const { mergedConfigs, effectiveBest } = useMergedWsiData(gdrive);

  if (view === "compare") return <ComparePaperPage onBack={() => setView("hub")} />;
  if (view === "metrics") return <MetricGlossaryPage onBack={() => setView("hub")} />;
  if (view === "overview") {
    return (
      <ResultsOverviewPage
        onBack={() => setView("hub")}
        mergedConfigs={mergedConfigs}
        effectiveBest={effectiveBest}
      />
    );
  }
  if (view === "overviewLarge") {
    return (
      <div>
        <button
          type="button"
          onClick={() => setView("hub")}
          className="mb-6 text-base text-[#9CA3AF] transition hover:text-[#E6EDF3]"
        >
          ← {wsiUi.analysis.backToAnalysis}
        </button>
        <SectionHeader title={wsiUi.analysis.overviewLargeBtn} />
        <div className="rounded-2xl border border-[#8B5CF6]/30 bg-[#111827] p-6 md:p-8">
          <LargeScalePanel />
        </div>
      </div>
    );
  }
  if (view === "ai") {
    return <AiSuggestPage onBack={() => setView("hub")} effectiveBest={effectiveBest} />;
  }
  if (view === "precision") {
    return <PrecisionRecallPage onBack={() => setView("hub")} effectiveBest={effectiveBest} />;
  }

  const hubCards = [
    {
      key: "compare" as const,
      title: wsiUi.analysis.compareBtn,
      desc: "看這次成績和論文裡的 Mask-RCNN 差多少",
      Icon: FaFlask,
    },
    {
      key: "precision" as const,
      title: "目前數據",
      desc: "目前有數字的指標",
      Icon: FaFlask,
    },
    {
      key: "metrics" as const,
      title: wsiUi.analysis.metricsBtn,
      desc: "每個指標點開，就看得到說明",
      Icon: FaFlask,
    },
    {
      key: "overview" as const,
      title: wsiUi.analysis.overviewBtn,
      desc: "50 組的完整排名",
      Icon: FaFlask,
    },
    {
      key: "overviewLarge" as const,
      title: wsiUi.analysis.overviewLargeBtn,
      desc: `共 ${largeScaleRunTotal} 次，點開看每一次`,
      Icon: FaFlask,
    },
    {
      key: "showcase" as const,
      title: "前端成果展示",
      desc: "直接開雲端資料夾",
      Icon: FaMicroscope,
    },
    {
      key: "ai" as const,
      title: wsiUi.analysis.aiSuggestBtn,
      desc: wsiUi.analysis.aiSuggestDesc,
      Icon: FaRobot,
    },
  ];

  return (
    <div className="text-base leading-relaxed">
      <SectionHeader title={wsiUi.analysis.title} />
      <p className="mb-8 text-base text-[#9CA3AF]">{wsiUi.analysis.hubHint}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {hubCards.map((card) => {
          const Icon = card.Icon;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => {
                if (card.key === "showcase") {
                  window.open(
                    `https://drive.google.com/drive/folders/${wsiLizardRootFolderId}`,
                    "_blank",
                    "noopener,noreferrer",
                  );
                  return;
                }
                setView(card.key);
              }}
              className="flex min-h-[148px] flex-col items-start justify-center rounded-2xl border border-[#8B5CF6]/35 bg-[#111827] p-6 text-left transition hover:border-[#8B5CF6]/70 hover:bg-[#1a1530]"
            >
              <Icon className="mb-3 text-xl text-[#C4B5FD]" />
              <span className="text-xl font-bold text-[#E6EDF3]">{card.title}</span>
              <span className="mt-2 text-base text-[#9CA3AF]">{card.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
