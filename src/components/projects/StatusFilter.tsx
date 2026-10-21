"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { projectStatusMeta } from "@/lib/medicalPortfolio";

const selectedClass: Record<string, string> = {
  all: "border-[#8B5CF6] bg-[#8B5CF6] text-white",
  "in-progress": "border-yellow-400 bg-yellow-400 text-[#0B0F14]",
  completed: "border-emerald-400 bg-emerald-400 text-[#0B0F14]",
  "not-started": "border-sky-400 bg-sky-400 text-[#0B0F14]",
};

export function StatusFilter({
  value,
  onChange,
  counts,
}: {
  value: string;
  onChange: (key: string) => void;
  counts: Record<string, number>;
}) {
  const { t, locale } = useI18n();
  const tabs = [
    { key: "all", label: t.status.all },
    { key: "in-progress", label: t.status.inProgress },
    { key: "completed", label: t.status.completed },
    { key: "not-started", label: t.status.notStarted },
  ];
  return (
    <div className="flex w-full gap-1.5 overflow-x-auto sm:w-auto sm:flex-wrap sm:gap-2" role="tablist" aria-label={t.status.filter}>
      {tabs.map((tab) => {
        const on = value === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(tab.key)}
            className={`shrink-0 rounded-full border px-1.5 py-1.5 text-sm font-semibold sm:px-4 sm:py-2 sm:text-base transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4ADE80] ${
              on
                ? selectedClass[tab.key]
                : `border-[#1F2937] bg-[#111827] text-[#BFD2EA] hover:border-[#4ADE80]/50 ${
                    projectStatusMeta[tab.key]?.text ?? ""
                  }`
            }`}
          >
            {tab.label}
            <span className={`ml-2 tabular-nums ${on ? "opacity-80" : "text-[#9CA3AF]"}`}>
              {counts[tab.key] ?? 0}{locale === "zh-Hant" || locale === "yue" ? " 個" : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function statusCounts(projects: { status: string }[]) {
  return {
    all: projects.length,
    "in-progress": projects.filter((project) => project.status === "in-progress").length,
    completed: projects.filter((project) => project.status === "completed").length,
    "not-started": projects.filter((project) => project.status === "not-started").length,
  };
}
