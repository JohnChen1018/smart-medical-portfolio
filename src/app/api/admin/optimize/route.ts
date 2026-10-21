import { NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal-auth";
import { canManageBackups } from "@/lib/portal-permissions";
import { logOperation } from "@/lib/portal-admin";
import {
  formatOptimizeSize,
  getOptimizeJobStatus,
  listOptimizationLogs,
  startBackgroundOptimize,
} from "@/lib/optimize-service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  const session = await getPortalSession();
  if (!session || !canManageBackups(session.role)) {
    return NextResponse.json({ ok: false, error: "未授權" }, { status: 401 });
  }

  const logs = listOptimizationLogs(20);
  return NextResponse.json({
    ok: true,
    job: getOptimizeJobStatus(),
    logs,
    formatSize: formatOptimizeSize,
  });
}

export async function POST() {
  const session = await getPortalSession();
  if (!session || !canManageBackups(session.role)) {
    return NextResponse.json({ ok: false, error: "未授權" }, { status: 401 });
  }

  const result = startBackgroundOptimize("admin-ui");

  await logOperation({
    accountId: session.accountId,
    username: session.username,
    role: session.role,
    action: "optimize-run",
    detail: result.started ? "已啟動一鍵優化（含強制備份）" : result.message,
  });

  return NextResponse.json({ ok: true, ...result });
}
