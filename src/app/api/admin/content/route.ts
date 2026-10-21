import { NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal-auth";
import { canEditContent } from "@/lib/portal-permissions";
import {
  getMedicalProjectById,
  getMedicalProjectSummaries,
  getMergedMedicalProjects,
  logOperation,
  saveMedicalProjects,
} from "@/lib/portal-admin";
import { startBackgroundBackup } from "@/lib/backup-service";

export async function GET(request: Request) {
  const session = await getPortalSession();
  if (!session || !canEditContent(session.role)) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const summary = searchParams.get("summary") === "1";

  if (id) {
    const project = await getMedicalProjectById(id);
    if (!project) return NextResponse.json({ error: "找不到作品" }, { status: 404 });
    return NextResponse.json({ project });
  }

  if (summary) {
    const projects = await getMedicalProjectSummaries();
    return NextResponse.json({ projects });
  }

  const projects = await getMergedMedicalProjects();
  return NextResponse.json({ projects });
}

export async function PUT(request: Request) {
  const session = await getPortalSession();
  if (!session || !canEditContent(session.role)) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  try {
    const { projects, autoBackup } = await request.json();
    if (!Array.isArray(projects) || projects.length === 0) {
      return NextResponse.json({ error: "格式錯誤或缺資料" }, { status: 400 });
    }

    await saveMedicalProjects(projects, session.username);

    await logOperation({
      accountId: session.accountId,
      username: session.username,
      role: session.role,
      action: "content-save",
      detail: `已儲存 ${projects.length} 個作品內容（標題／狀態／工作流程 Markdown）`,
    });

    let backup = null;
    if (autoBackup) {
      backup = startBackgroundBackup({ type: "CONTENT", trigger: "content-save" });
    }

    return NextResponse.json({
      success: true,
      backup,
      message: "已寫入資料庫，訪客重新整理即可看到更新",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "儲存失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
