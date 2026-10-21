"use client";

import Link from "next/link";
import { FaChevronLeft } from "react-icons/fa";
import { Badge } from "@/components/ui/Badge";
import { Project } from "@/lib/types";
import { projectStatusMeta } from "@/lib/medicalPortfolio";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { statusLabel } from "@/lib/i18n/copy";
import { surveyTopics, surveyTracks } from "@/lib/surveyPaperData";
import { SurveyTrackDetailGantt } from "@/components/projects/SurveyGanttChart";
import { ExternalResearchSearch } from "@/components/projects/ExternalResearchSearch";
import { SurveyOpenDataPanel } from "@/components/projects/SurveyOpenDataPanel";

interface SurveyPaperDetailViewProps {
  project: Project;
  topicId: string;
  onBack?: () => void;
}

export function SurveyPaperDetailView({ project, topicId, onBack }: SurveyPaperDetailViewProps) {
  const { t } = useI18n();
  const statusMeta =
    projectStatusMeta[project.status] ?? projectStatusMeta["not-started"];
  const plan = surveyTopics[topicId];
  const track = surveyTracks.find((t) => t.id === topicId);

  if (!plan || !track) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#E6EDF3]">
      <nav
        className="sticky z-40 border-b border-[#1F2937] bg-[#0B0F14]/90 px-6 py-4 backdrop-blur-md"
        style={{ top: "var(--site-header-h, 4rem)" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 rounded-full border border-[#1F2937] bg-[#111827] px-4 py-2 text-base font-semibold text-[#E6EDF3] transition hover:border-[#4ADE80]/50"
            >
              <FaChevronLeft className="text-xs" />
              {t.survey.backTopics}
            </button>
          ) : (
            <Link
              href="/projects"
              className="flex items-center gap-2 rounded-full border border-[#1F2937] bg-[#111827] px-4 py-2 text-base font-semibold text-[#E6EDF3] transition hover:border-[#4ADE80]/50"
            >
              <FaChevronLeft className="text-xs" />
              {t.detail.back}
            </Link>
          )}
          <div
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${statusMeta.bg} ${statusMeta.border}`}
          >
            <span className={`h-2 w-2 rounded-full ${statusMeta.dot}`} />
            <span className={`text-xs font-medium ${statusMeta.text}`}>
              {statusLabel(t, project.status)}
            </span>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <Badge className="mb-4 border-[#8B5CF6]/20 bg-[#8B5CF6]/10 text-[#C4B5FD]">
          {project.category} · {plan.group}
        </Badge>
        <h1 className="text-4xl font-black md:text-5xl">{plan.title}</h1>
        <p className="mt-4 inline-block rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-1.5 text-sm font-semibold text-yellow-200">
          前 2 週完成初稿 · 之後每週修改至 {plan.trackEnd.replace(/-/g, "/").slice(5)}
        </p>

        <div className="mt-10">
          <SurveyOpenDataPanel topicId={topicId} />
        </div>

        <div className="mt-10">
          <ExternalResearchSearch
            title={`${plan.title} 外部快速跳轉`}
            defaultQuery={`${plan.title} medical AI review`}
            suggestions={[
              `${plan.title} systematic review`,
              `${plan.title} deep learning`,
              `${plan.title} clinical application`,
            ]}
          />
        </div>

        <div className="mt-10">
          <SurveyTrackDetailGantt track={track} phases={plan.phases} />
        </div>
      </main>
    </div>
  );
}
