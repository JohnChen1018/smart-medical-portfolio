import { notFound } from "next/navigation";
import { SurveyPaperHubView } from "@/components/projects/SurveyPaperHubView";
import { ProjectDetailView } from "@/components/projects/ProjectDetailView";
import {
  MpoxWorkflowDashboard,
  WorkflowDashboard,
} from "@/components/projects/ProjectDashboardLoader";
import { mpoxMeta } from "@/lib/mpoxDashboard";
import { getMergedMedicalProjects } from "@/lib/portal-admin";
import { wsiMeta } from "@/lib/wsiDashboard";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const medicalProjects = await getMergedMedicalProjects();

  const project = medicalProjects.find((item) => item.id === id);

  if (!project) {
    return notFound();
  }

  if (id === wsiMeta.projectId) {
    return (
      <WorkflowDashboard
        title={project.title}
        backHref="/projects"
        project={project}
      />
    );
  }

  if (id === mpoxMeta.projectId) {
    return (
      <MpoxWorkflowDashboard
        title={project.title}
        backHref="/projects"
      />
    );
  }

  if (id === "survey-paper") {
    return <SurveyPaperHubView project={project} />;
  }

  return <ProjectDetailView project={project} />;
}
