import type { ApplicationCard } from "@/lib/wsiDashboard";
import { applicationSection } from "@/lib/wsiDashboard";
import type { Project } from "@/lib/types";

export type WsiApplicationOverrides = {
  title?: string;
  intro?: string;
  cards?: Array<Partial<ApplicationCard> & { id: string }>;
};

export type ProjectDashboardOverrides = {
  wsi?: {
    application?: WsiApplicationOverrides;
  };
};

export type ProjectWithDashboard = Project & {
  dashboardOverrides?: ProjectDashboardOverrides;
};

export function getMergedApplicationSection(project?: Pick<ProjectWithDashboard, "dashboardOverrides"> | null) {
  const base = applicationSection;
  const ov = project?.dashboardOverrides?.wsi?.application;
  if (!ov) return base;

  return {
    title: ov.title ?? base.title,
    intro: ov.intro ?? base.intro,
    cards: base.cards.map((card) => {
      const patch = ov.cards?.find((c) => c.id === card.id);
      return patch ? ({ ...card, ...patch } as ApplicationCard) : card;
    }),
  };
}

export function patchApplicationOverrides(
  project: ProjectWithDashboard,
  patch: WsiApplicationOverrides,
): ProjectWithDashboard {
  const prev = project.dashboardOverrides?.wsi?.application ?? {};
  const cardMap = new Map((prev.cards ?? []).map((c) => [c.id, c]));

  if (patch.cards) {
    for (const c of patch.cards) {
      cardMap.set(c.id, { ...cardMap.get(c.id), ...c });
    }
  }

  return {
    ...project,
    dashboardOverrides: {
      ...project.dashboardOverrides,
      wsi: {
        ...project.dashboardOverrides?.wsi,
        application: {
          title: patch.title ?? prev.title,
          intro: patch.intro ?? prev.intro,
          cards: Array.from(cardMap.values()),
        },
      },
    },
  };
}
