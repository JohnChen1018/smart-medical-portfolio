"use client";

import nextDynamic from "next/dynamic";
import type { ComponentProps } from "react";

const dashboardLoading = (
  <div className="flex min-h-screen items-center justify-center bg-[#0B0F14] text-[#9CA3AF]">
    載入研究工作流程…
  </div>
);

const WorkflowDashboardInner = nextDynamic(
  () =>
    import("@/components/projects/WorkflowDashboard").then((m) => m.WorkflowDashboard),
  { ssr: false, loading: () => dashboardLoading },
);

const MpoxWorkflowDashboardInner = nextDynamic(
  () =>
    import("@/components/projects/MpoxWorkflowDashboard").then(
      (m) => m.MpoxWorkflowDashboard,
    ),
  { ssr: false, loading: () => dashboardLoading },
);

export function WorkflowDashboard(
  props: ComponentProps<typeof WorkflowDashboardInner>,
) {
  return <WorkflowDashboardInner {...props} />;
}

export function MpoxWorkflowDashboard(
  props: ComponentProps<typeof MpoxWorkflowDashboardInner>,
) {
  return <MpoxWorkflowDashboardInner {...props} />;
}
