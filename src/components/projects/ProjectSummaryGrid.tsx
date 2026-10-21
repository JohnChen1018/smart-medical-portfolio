"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { statusLabel, workCopy } from "@/lib/i18n/copy";

export type ProjectCard = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  status: string;
  imageUrl?: string | null;
};

function thumbUrl(url: string) {
  if (!url.includes("images.unsplash.com")) return url;
  return url.replace(/([?&])w=\d+/, "$1w=320").replace(/([?&])h=\d+/, "$1h=240");
}

const statusTone: Record<string, { card: string; text: string; dot: string }> = {
  "in-progress": { card: "border-amber-400/70 bg-amber-400/15", text: "text-amber-300", dot: "bg-amber-400" },
  developing: { card: "border-amber-400/70 bg-amber-400/15", text: "text-amber-300", dot: "bg-amber-400" },
  completed: { card: "border-emerald-400/70 bg-emerald-400/15", text: "text-emerald-300", dot: "bg-emerald-400" },
  live: { card: "border-emerald-400/70 bg-emerald-400/15", text: "text-emerald-300", dot: "bg-emerald-400" },
  "not-started": { card: "border-sky-400/70 bg-sky-400/15", text: "text-sky-300", dot: "bg-sky-400" },
  planned: { card: "border-sky-400/70 bg-sky-400/15", text: "text-sky-300", dot: "bg-sky-400" },
  archived: { card: "border-sky-400/70 bg-sky-400/15", text: "text-sky-300", dot: "bg-sky-400" },
};

export function statusToneFor(status: string) {
  return statusTone[status] ?? statusTone["not-started"];
}

export function ProjectSummaryGrid({ projects }: { projects: ProjectCard[] }) {
  const { t } = useI18n();

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {projects.map((project) => {
        const copy = workCopy(t, project.id, project);
        const tone = statusToneFor(project.status);
        return (
          <li key={project.id} className="min-h-0">
            <Link
              href={`/projects/${project.id}`}
              className={`flex h-full scroll-mt-32 flex-col overflow-hidden rounded-2xl border transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4ADE80] ${tone.card}`}
            >
              <span className={`relative block overflow-hidden bg-[#0B0F14] ${project.imageUrl ? "aspect-[16/10]" : "h-14"}`}>
                {project.imageUrl ? (
                  <img
                    src={thumbUrl(project.imageUrl)}
                    alt=""
                    width={640}
                    height={400}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}
                <span className={`absolute left-3 inline-flex items-center gap-2 rounded-full bg-[#0B0F14]/85 px-2.5 py-1 text-sm font-bold ${project.imageUrl ? "top-3" : "top-1/2 -translate-y-1/2"} ${tone.text}`}>
                  <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
                  {statusLabel(t, project.status)}
                </span>
              </span>
              <span className="flex min-h-0 flex-1 flex-col p-4">
                <span className="text-sm text-[#BFD2EA]">{copy.category}</span>
                <span className="mt-1 text-xl font-black leading-snug text-[#E6EDF3]">{copy.title}</span>
                {project.id === "face" || copy.description ? (
                  <span className="mt-2 line-clamp-3 text-base leading-7 text-[#E6EDF3]/85">{project.id === "face" ? t.about.empty : copy.description}</span>
                ) : null}
                <span className="mt-auto block pt-4">
                  <span className="inline-flex w-fit rounded-full bg-[#4ADE80] px-3 py-1 text-sm font-bold text-[#0B0F14]">打開</span>
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
