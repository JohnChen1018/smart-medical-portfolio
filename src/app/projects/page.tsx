import { ProjectsView } from "@/components/projects/ProjectsView";
import { getMedicalProjectSummaries } from "@/lib/portal-admin";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const projects = await getMedicalProjectSummaries();

  return (
    <ProjectsView
      initialProjects={projects}
      initialStatus={status ?? "all"}
    />
  );
}
