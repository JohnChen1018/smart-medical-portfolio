import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { medicalProjects } from "@/lib/medicalPortfolio";
import type { Project } from "@/lib/types";

const DEFAULT_ADMIN_USER = process.env.PORTAL_ADMIN_USER ?? "m215";
const DEFAULT_ADMIN_PASS = process.env.PORTAL_ADMIN_PASSWORD ?? "m215";

export async function ensurePortalAdmin() {
  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASS, 10);

  return prisma.portalAccount.upsert({
    where: { username: DEFAULT_ADMIN_USER },
    create: {
      username: DEFAULT_ADMIN_USER,
      displayName: "管理員",
      passwordHash,
      role: "admin",
      permissions: "accounts,backups,logs,content",
      source: "平台設定",
    },
    update: {
      role: "admin",
      isActive: true,
    },
  });
}

export async function logOperation(input: {
  accountId?: string;
  username: string;
  role: string;
  action: string;
  detail?: string;
  ipAddress?: string;
  device?: string;
}) {
  return prisma.operationLog.create({ data: input });
}

export async function getMergedMedicalProjects(): Promise<Project[]> {
  const row = await prisma.medicalSiteContent.findUnique({
    where: { id: "default" },
  });
  if (!row?.projectsJson) return medicalProjects;

  try {
    const overrides = row.projectsJson as unknown as Project[];
    if (!Array.isArray(overrides) || overrides.length === 0) return medicalProjects;
    const map = new Map(overrides.map((p) => [p.id, p]));
    return medicalProjects.map((p) => ({ ...p, ...map.get(p.id) }));
  } catch {
    return medicalProjects;
  }
}

export type ProjectSummary = Pick<
  Project,
  "id" | "title" | "description" | "category" | "status" | "imageUrl" | "displayOrder"
>;

export async function getMedicalProjectSummaries(): Promise<ProjectSummary[]> {
  const projects = await getMergedMedicalProjects();
  return projects.map(({ id, title, description, category, status, imageUrl, displayOrder }) => ({
    id,
    title,
    description,
    category,
    status,
    imageUrl,
    displayOrder,
  }));
}

export async function getMedicalProjectById(id: string): Promise<Project | null> {
  const projects = await getMergedMedicalProjects();
  return projects.find((p) => p.id === id) ?? null;
}

export async function saveMedicalProjects(projects: Project[], updatedBy: string) {
  // 以程式內建列表為底，只覆蓋傳入的專案，避免部分陣列覆寫整庫
  const incoming = new Map(projects.map((p) => [p.id, p]));
  const merged = medicalProjects.map((base) => {
    const ov = incoming.get(base.id);
    return ov ? ({ ...base, ...ov } as Project) : base;
  });
  for (const [id, p] of incoming) {
    if (!merged.some((m) => m.id === id)) merged.push(p);
  }
  const json = JSON.parse(JSON.stringify(merged));
  return prisma.medicalSiteContent.upsert({
    where: { id: "default" },
    create: { id: "default", projectsJson: json, updatedBy },
    update: { projectsJson: json, updatedBy },
  });
}
