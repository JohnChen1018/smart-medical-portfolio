import type { Dictionary, StepKey } from "@/lib/i18n/types";

const workIds = ["whole-slide-object-detection", "survey-paper", "cat-lymphoma", "monkeypox", "face"] as const;
type WorkId = (typeof workIds)[number];

function isWorkId(id: string): id is WorkId {
  return workIds.includes(id as WorkId);
}

export function workCopy(
  t: Dictionary,
  id: string,
  fallback: { title: string; description?: string | null; category?: string | null },
) {
  if (!isWorkId(id)) {
    return {
      title: fallback.title,
      description: fallback.description || "",
      category: fallback.category || "",
    };
  }
  const item = t.projects.items[id];
  return {
    title: item.title,
    description: item.description || fallback.description || "",
    category: item.category || fallback.category || "",
  };
}

export function statusLabel(t: Dictionary, status: string) {
  if (status === "in-progress" || status === "developing") return t.status.inProgress;
  if (status === "completed" || status === "live") return t.status.completed;
  if (status === "not-started" || status === "planned" || status === "archived") return t.status.notStarted;
  return status;
}

const stepKeys: StepKey[] = ["application", "data", "modeling", "simulation", "analysis"];

export function isStepKey(value: string): value is StepKey {
  return stepKeys.includes(value as StepKey);
}
