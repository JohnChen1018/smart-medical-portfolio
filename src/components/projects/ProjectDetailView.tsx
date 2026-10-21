"use client";

import Image from "next/image";
import Link from "next/link";
import { FaChevronLeft } from "react-icons/fa";
import { Badge } from "@/components/ui/Badge";
import { Project } from "@/lib/types";
import {
  projectStatusMeta,
  workflowSteps,
} from "@/lib/medicalPortfolio";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { isStepKey, statusLabel, workCopy } from "@/lib/i18n/copy";

interface ProjectDetailViewProps {
  project: Project;
}

export function ProjectDetailView({ project }: ProjectDetailViewProps) {
  const { t } = useI18n();
  const copy = workCopy(t, project.id, project);
  const statusMeta =
    projectStatusMeta[project.status] ?? projectStatusMeta["not-started"];

  if (project.id === "face") {
    return (
      <div className="min-h-screen bg-[#0B0F14] text-[#E6EDF3]">
        <nav
          className="sticky z-40 border-b border-[#1F2937] bg-[#0B0F14]/90 px-6 py-4 backdrop-blur-md"
          style={{ top: "var(--site-header-h, 4rem)" }}
        >
          <div className="mx-auto max-w-7xl">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-full border border-[#1F2937] bg-[#111827] px-4 py-2 text-base font-semibold"
            >
              <FaChevronLeft className="text-xs" />
              {t.detail.back}
            </Link>
          </div>
        </nav>
        <main className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="text-4xl font-black">{copy.title}</h1>
          <p className="mt-4 text-lg text-[#BFD2EA]">{t.about.empty}</p>
        </main>
      </div>
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
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <Badge className="mb-4 bg-[#4ADE80]/10 text-[#4ADE80] border-[#4ADE80]/20">
              {copy.category}
            </Badge>
            <h1 className="text-3xl font-black leading-tight md:text-4xl">
              {copy.title}
            </h1>
            {copy.description ? (
              <p className="mt-4 max-w-2xl text-lg leading-8 text-[#BFD2EA]">{copy.description}</p>
            ) : null}
          </div>

          <div className="lg:col-span-5">
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-[#1F2937] bg-[#111827] shadow-2xl">
              <Image
                src={
                  project.imageUrl ||
                  "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=900&h=650&fit=crop"
                }
                alt={project.title}
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F14]/80 to-transparent" />
            </div>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-black text-[#E6EDF3]">
            {t.detail.steps}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {workflowSteps.map((step, index) => (
              <Link
                key={step.key}
                href={`/projects/${project.id}/${step.key}`}
                className="rounded-2xl border border-[#1F2937] bg-[#111827]/70 p-5 transition hover:-translate-y-1 hover:border-[#8B5CF6]/70"
              >
                <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#8B5CF6]/15 text-sm font-bold text-[#C4B5FD]">
                  {index + 1}
                </span>
                <h3 className="text-lg font-bold text-[#E6EDF3]">
                  {isStepKey(step.key) ? t.steps[step.key].label : step.label}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">{isStepKey(step.key) ? t.steps[step.key].description : step.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
