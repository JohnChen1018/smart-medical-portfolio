"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaChevronLeft } from "react-icons/fa";
import { Badge } from "@/components/ui/Badge";
import { Project } from "@/lib/types";
import { projectStatusMeta } from "@/lib/medicalPortfolio";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { statusLabel, workCopy } from "@/lib/i18n/copy";
import { SurveyPaperDetailView } from "@/components/projects/SurveyPaperDetailView";
import { SurveyOpenDataPanel } from "@/components/projects/SurveyOpenDataPanel";
import { surveyHubDeadline } from "@/lib/surveyPaperData";

const topicCards = [
  {
    id: "survey-mpox" as const,
    title: "猴痘 Survey Paper",
    summary: "7 月寫猴痘這篇綜述",
    imageUrl:
      "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=900&h=650&fit=crop",
  },
  {
    id: "survey-cat-lymphoma" as const,
    title: "貓淋巴癌 Survey Paper",
    summary: "7 月到 8 月中，寫貓淋巴癌的臨床應用",
    imageUrl:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=900&h=650&fit=crop",
  },
  {
    id: "survey-wsi" as const,
    title: "WSI Survey Paper",
    summary: "8 月寫全切片這篇，可以延伸到 9 月底",
    imageUrl:
      "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=900&h=650&fit=crop",
  },
  {
    id: "survey-cross-review" as const,
    title: "Survey Paper 交叉修訂",
    summary: "9 月把幾篇再一起改一次",
    imageUrl:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=900&h=650&fit=crop",
  },
];

interface SurveyPaperHubViewProps {
  project: Project;
}

export function SurveyPaperHubView({ project }: SurveyPaperHubViewProps) {
  const [selectedTopic, setSelectedTopic] = useState<(typeof topicCards)[number]["id"] | null>(null);
  const { t } = useI18n();
  const copy = workCopy(t, project.id, project);
  const statusMeta =
    projectStatusMeta[project.status] ?? projectStatusMeta["not-started"];

  if (selectedTopic) {
    return (
      <SurveyPaperDetailView
        project={project}
        topicId={selectedTopic}
        onBack={() => setSelectedTopic(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#E6EDF3]">
      <nav
        className="sticky z-40 border-b border-[#1F2937] bg-[#0B0F14]/90 px-6 py-4 backdrop-blur-md"
        style={{ top: "var(--site-header-h, 4rem)" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href="/projects"
            className="flex items-center gap-2 rounded-full border border-[#1F2937] bg-[#111827] px-4 py-2 text-base font-semibold text-[#E6EDF3] transition hover:border-[#4ADE80]/50"
          >
            <FaChevronLeft className="text-xs" />
            {t.detail.back}
          </Link>
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
          {copy.category}
        </Badge>
        <h1 className="text-3xl font-black md:text-4xl">{copy.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[#BFD2EA]">
          {t.survey.intro}
        </p>
        <p className="mt-2 text-sm text-[#6B7280]">{surveyHubDeadline}</p>

        <div className="mt-10">
          <SurveyOpenDataPanel topicId="survey-paper" />
        </div>

        <h2 className="mb-4 mt-12 text-xl font-black text-[#E6EDF3]">{t.survey.topicsTitle}</h2>
        <div className="group/list flex flex-col gap-3">
          {topicCards.map((topic) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => setSelectedTopic(topic.id)}
              className="group flex items-center gap-4 rounded-2xl border border-[#1F2937] bg-[#111827] p-3 text-left transition duration-200 hover:border-[#8B5CF6]/50 hover:!opacity-100 group-hover/list:opacity-45"
            >
              <div className="relative hidden h-16 w-28 shrink-0 overflow-hidden rounded-xl sm:block">
                <Image
                  src={topic.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-[#E6EDF3] group-hover:text-[#C4B5FD]">
                  {t.survey.topics[topic.id].title}
                </h3>
                <p className="mt-1 text-base text-[#BFD2EA]">{t.survey.topics[topic.id].summary}</p>
              </div>
              <span className="shrink-0 text-lg font-semibold text-[#9CA3AF] group-hover:text-[#C4B5FD]" aria-hidden>
                →
              </span>
            </button>
          ))}
        </div>

      </main>
    </div>
  );
}
