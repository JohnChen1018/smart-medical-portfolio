"use client";

import { useState } from "react";
import { FaExternalLinkAlt } from "react-icons/fa";
import { SectionHeader } from "@/components/projects/shared/SectionHeader";
import { getMergedApplicationSection, type ProjectWithDashboard } from "@/lib/wsiCms";
import type { ApplicationCard } from "@/lib/wsiDashboard";
import { wsiUi } from "@/lib/wsiUiLabels";

function frontFaceClass(card: ApplicationCard) {
  if (card.accent === "emerald") {
    return "border-emerald-400/40 bg-gradient-to-br from-emerald-950/50 to-[#111827]";
  }
  if (card.highlight) {
    return "border-[#8B5CF6]/50 bg-gradient-to-br from-[#241b52] to-[#111827]";
  }
  return "border-[#1F2937] bg-[#111827]";
}

function backFaceClass(card: ApplicationCard) {
  if (card.accent === "emerald") {
    return "border-emerald-400/40 bg-gradient-to-br from-emerald-950/60 to-[#111827]";
  }
  return "border-[#8B5CF6]/40 bg-gradient-to-br from-[#1E1B4B] to-[#111827]";
}

export function ApplicationTab({ project }: { project?: ProjectWithDashboard | null }) {
  const app = getMergedApplicationSection(project);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div>
      <SectionHeader title={app.title} />
      <p className="mb-8 max-w-4xl text-base leading-8 text-[#BFD2EA]">{app.intro}</p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {app.cards.map((card) => {
          const open = openId === card.id;
          return (
            <div key={card.id} className="relative h-80 [perspective:1200px]">
              <div
                className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
                  open ? "[transform:rotateY(180deg)]" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : card.id)}
                  className={`absolute inset-0 flex flex-col overflow-hidden rounded-2xl border p-6 text-left [backface-visibility:hidden] ${frontFaceClass(card)}`}
                >
                  <span className="text-3xl">{card.icon}</span>
                  {card.highlight && (
                    <span className="mt-2 w-fit rounded-full bg-[#8B5CF6]/20 px-2 py-0.5 text-xs font-semibold text-[#C4B5FD]">
                      {wsiUi.application.highlight}
                    </span>
                  )}
                  {card.accent === "emerald" && (
                    <span className="mt-2 w-fit rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                      理念
                    </span>
                  )}
                  <h3 className="mt-3 text-xl font-bold leading-snug text-[#E6EDF3]">{card.title}</h3>
                  <p className="mt-2 text-base leading-7 text-[#BFD2EA]">{card.summary}</p>
                </button>
                <div
                  className={`absolute inset-0 flex flex-col overflow-hidden rounded-2xl border p-5 [backface-visibility:hidden] [transform:rotateY(180deg)] ${backFaceClass(card)}`}
                >
                  <h3
                    className={`text-lg font-bold leading-snug ${card.accent === "emerald" ? "text-emerald-300" : "text-[#C4B5FD]"}`}
                  >
                    {card.title}
                  </h3>
                  <p className="mt-2 flex-1 overflow-y-auto pr-1 text-base leading-7 text-[#E6EDF3]">{card.detail}</p>
                  <div className="mt-2 flex shrink-0 flex-wrap items-center gap-3 pt-2">
                    <a
                      href={card.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#22D3EE]"
                    >
                      <FaExternalLinkAlt className="text-[10px]" />
                      {card.sourceLabel}
                    </a>
                    <button
                      type="button"
                      onClick={() => setOpenId(null)}
                      className="text-sm text-[#9CA3AF] hover:text-[#E6EDF3]"
                    >
                      翻回正面
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
