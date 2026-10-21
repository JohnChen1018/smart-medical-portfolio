"use client";

import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { Project } from "@/lib/types";
import Image from "next/image";
import { projectStatusMeta } from "@/lib/medicalPortfolio";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { statusLabel, workCopy } from "@/lib/i18n/copy";

interface ProjectCardProps {
  project: Project;
  index?: number;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { t } = useI18n();
  const copy = workCopy(t, project.id, project);
  const normalizedStatus =
    project.status === "live"
      ? "completed"
      : project.status === "developing"
        ? "in-progress"
        : project.status === "planned" || project.status === "archived"
          ? "not-started"
          : project.status;
  const statusMeta =
    projectStatusMeta[normalizedStatus] ?? projectStatusMeta["not-started"];

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group/card flex items-stretch gap-4 rounded-2xl border border-[#1F2937] bg-[#111827]/70 p-3 transition duration-200 hover:border-[#4ADE80]/50 hover:bg-[#111827] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4ADE80] group-hover/list:opacity-45 hover:!opacity-100"
    >
      <div className="relative hidden h-24 w-36 shrink-0 overflow-hidden rounded-xl bg-[#0B0F14] sm:block">
        <Image
          src={project.imageUrl || "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=900&h=650&fit=crop"}
          alt=""
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-1">
        {project.category ? (
            <Badge variant="primary" className="w-fit text-xs font-medium">
              {copy.category}
            </Badge>
          ) : null}
          <h3 className="text-xl font-bold text-[#E6EDF3] group-hover/card:text-[#4ADE80]">
            {copy.title}
          </h3>
          {copy.description ? (
            <p className="line-clamp-2 text-base leading-7 text-[#BFD2EA]">{copy.description}</p>
          ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end justify-between py-1">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-semibold ${statusMeta.border} ${statusMeta.bg} ${statusMeta.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
          {statusLabel(t, project.status)}
        </span>
        <span className="text-lg font-semibold text-[#9CA3AF] group-hover/card:text-[#4ADE80]" aria-hidden>
          →
        </span>
      </div>
    </Link>
  );
}
