import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalSession } from "@/lib/portal-auth";
import { canManageBackups } from "@/lib/portal-permissions";
import {
  ensureBackupScheduler,
  getBackupJobStatus,
  getBackupSchedule,
  listCloudBackups,
  maybeRunScheduledBackup,
  startBackgroundBackup,
} from "@/lib/backup-service";
import { logOperation } from "@/lib/portal-admin";

ensureBackupScheduler();

async function queryWindowsTasks() {
  if (process.platform !== "win32") return "非 Windows";
  const names = [
    "SmartMedicalPortfolio-Backup-s125727277",
    "SmartMedicalPortfolio-Backup-s125727277-PM",
    "Portfolio-DailyBackup",
  ];
  const found: string[] = [];
  try {
    const { execSync } = await import("node:child_process");
    for (const name of names) {
      try {
        const out = execSync(`schtasks /Query /TN "${name}" /FO LIST`, { encoding: "utf8" });
        const status = /Status:\s*(.+)/i.exec(out)?.[1]?.trim() || "已安裝";
        found.push(`${name}（${status}）`);
      } catch {
        /* not installed */
      }
    }
  } catch {
    return "無法查詢";
  }
  return found.length ? found.join("；") : "未安裝 Windows 工作排程（網站內建排程仍可用）";
}

export async function GET() {
  const session = await getPortalSession();
  if (!session || !canManageBackups(session.role)) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  void maybeRunScheduledBackup();

  const schedule = await getBackupSchedule();
  const job = getBackupJobStatus();
  const records = await prisma.backupRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const cloudFiles = await listCloudBackups(10);
  const taskStatus = await queryWindowsTasks();

  return NextResponse.json({ schedule, records, taskStatus, job, cloudFiles, keepCount: 10 });
}

export async function PUT(request: Request) {
  const session = await getPortalSession();
  if (!session || !canManageBackups(session.role)) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const { enabled, runAt, runAt2, cloudPath } = await request.json();
  if (runAt && !/^\d{2}:\d{2}$/.test(runAt)) {
    return NextResponse.json({ error: "時間①格式須為 HH:MM" }, { status: 400 });
  }
  if (runAt2 && !/^\d{2}:\d{2}$/.test(runAt2)) {
    return NextResponse.json({ error: "時間②格式須為 HH:MM" }, { status: 400 });
  }

  const schedule = await prisma.backupSchedule.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      enabled: Boolean(enabled),
      runAt: runAt || "09:00",
      runAt2: runAt2 || "21:00",
      cloudPath: cloudPath || undefined,
      updatedBy: session.username,
    },
    update: {
      enabled: Boolean(enabled),
      runAt: runAt || "09:00",
      runAt2: runAt2 || "21:00",
      ...(cloudPath ? { cloudPath } : {}),
      updatedBy: session.username,
    },
  });

  await logOperation({
    accountId: session.accountId,
    username: session.username,
    role: session.role,
    action: "schedule-save",
    detail: `備份排程 ${enabled ? "啟用" : "停用"} · ${schedule.runAt}${schedule.runAt2 ? ` / ${schedule.runAt2}` : ""}`,
  });

  return NextResponse.json({ schedule });
}

export async function POST(request: Request) {
  const session = await getPortalSession();
  if (!session || !canManageBackups(session.role)) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const type = body.type || "FULL";
  const result = startBackgroundBackup({ type, trigger: body.trigger || "manual" });

  await logOperation({
    accountId: session.accountId,
    username: session.username,
    role: session.role,
    action: "backup-run",
    detail: result.started ? "已啟動手動／內容備份" : result.message,
  });

  return NextResponse.json(result);
}
