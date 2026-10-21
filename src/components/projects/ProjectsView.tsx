"use client";

import { useState } from "react";
import { ProjectSummaryGrid, type ProjectCard } from "@/components/projects/ProjectSummaryGrid";
import { statusCounts, StatusFilter } from "@/components/projects/StatusFilter";
import { useI18n } from "@/components/i18n/LocaleProvider";

interface ProjectsViewProps {
  initialProjects: ProjectCard[];
  initialStatus?: string;
}

export function ProjectsView({
  initialProjects,
  initialStatus = "all",
}: ProjectsViewProps) {
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const { t } = useI18n();

  const filteredProjects = initialProjects.filter((project) =>
    selectedStatus === "all" ? true : project.status === selectedStatus,
  );

  return (
    <div className="relative min-h-screen bg-[#0B0F14]">
      <section className="relative z-10 px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div
            className="sticky z-30 mb-4 flex flex-col gap-3 border-b border-[#1F2937] bg-[#0B0F14] py-2 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-3"
            style={{ top: "var(--site-header-h, 4rem)" }}
          >
            <h1 className="text-2xl font-black text-[#E6EDF3] sm:text-3xl">{t.home.works}</h1>
            <StatusFilter
              value={selectedStatus}
              onChange={setSelectedStatus}
              counts={statusCounts(initialProjects)}
            />
          </div>

          {filteredProjects.length > 0 ? (
            <ProjectSummaryGrid projects={filteredProjects} />
          ) : (
            <div className="text-center py-16 border border-dashed border-[#374151] rounded-2xl bg-[#111827]/20">
              <p className="text-lg text-[#9CA3AF]">{t.projects.empty}</p>
              <button
                type="button"
                onClick={() => setSelectedStatus("all")}
                className="mt-4 text-base font-semibold text-[#4ADE80] hover:underline"
              >
                {t.projects.seeAll}
              </button>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
