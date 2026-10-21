import { backupCloudRoot, backupLocalRoot } from "@/lib/datasetPaths";
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { execSync, spawnSync } from "node:child_process";
import { join } from "node:path";
import { prisma } from "@/lib/prisma";

const root = process.cwd();
const KEEP_BACKUPS = 10;

type BackupJobState = {
  running: boolean;
  startedAt: string | null;
  lastResult: "success" | "failed" | null;
  lastMessage: string | null;
};

const backupJob: BackupJobState = {
  running: false,
  startedAt: null,
  lastResult: null,
  lastMessage: null,
};

let schedulerStarted = false;

export function getBackupJobStatus() {
  return { ...backupJob };
}

/** 本機備份根目錄（請以 BACKUP_ROOT 指向實際路徑，預設為專案 data/backups/local） */
export function backupRoot() {
  return backupLocalRoot();
}

function cloudBackupDir() {
  return backupCloudRoot();
}

async function resolveCloudDir() {
  try {
    const schedule = await prisma.backupSchedule.findUnique({ where: { id: "default" } });
    if (schedule?.cloudPath) return schedule.cloudPath;
  } catch {
    /* ignore */
  }
  return cloudBackupDir();
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** 檔名時間戳：portfolio_20260708_225757 → 2026/07/08 22:57:57 */
export function labelFromBackupName(name: string) {
  const m = name.match(/portfolio_(\d{4})(\d{2})(\d{2})[_T]?(\d{2})(\d{2})(\d{2})/);
  if (!m) return name;
  return `${m[1]}/${m[2]}/${m[3]} ${m[4]}:${m[5]}:${m[6]}`;
}

function listPortfolioFiles(dir: string) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.startsWith("portfolio_") && (f.endsWith(".zip") || f.endsWith(".tar.gz")))
    .map((f) => ({ f, full: join(dir, f), m: statSync(join(dir, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m);
}

export function pruneOldBackups(dir: string, keep = KEEP_BACKUPS) {
  const files = listPortfolioFiles(dir);
  const removed: string[] = [];
  for (const item of files.slice(keep)) {
    try {
      unlinkSync(item.full);
      removed.push(item.f);
    } catch {
      /* ignore locked files */
    }
  }
  return removed;
}

async function uploadToCloud(localFile: string) {
  const cloudDir = await resolveCloudDir();
  mkdirSync(cloudDir, { recursive: true });
  const name = localFile.split(/[/\\]/).pop() || "backup.zip";
  const cloudFile = join(cloudDir, name);
  copyFileSync(localFile, cloudFile);
  const removed = pruneOldBackups(cloudDir, KEEP_BACKUPS);
  return { cloudFile, cloudDir, removed, label: labelFromBackupName(name) };
}

export function startBackgroundBackup(options: { type?: string; trigger?: string } = {}) {
  if (backupJob.running) {
    return { started: false as const, running: true, message: "備份進行中" };
  }

  backupJob.running = true;
  backupJob.startedAt = new Date().toISOString();
  backupJob.lastResult = null;
  backupJob.lastMessage = "備份進行中…";

  void runPortfolioBackup(options)
    .then((result) => {
      backupJob.lastResult = result.ok ? "success" : "failed";
      if (result.ok) {
        const label = result.label || labelFromBackupName(result.filePath.split(/[/\\]/).pop() || "");
        backupJob.lastMessage = `備份成功（${label}），已同步雲端；僅保留最新 ${KEEP_BACKUPS} 份`;
      } else {
        backupJob.lastMessage = result.error || result.record?.message || "備份失敗";
      }
    })
    .catch((error) => {
      backupJob.lastResult = "failed";
      backupJob.lastMessage = error instanceof Error ? error.message : "備份失敗";
    })
    .finally(() => {
      backupJob.running = false;
    });

  return { started: true as const, running: true, message: "已開始背景備份，可切換其他頁面" };
}

export async function runPortfolioBackup(options: {
  type?: string;
  trigger?: string;
} = {}) {
  const type = options.type ?? "FULL";
  const trigger = options.trigger ?? "manual";
  const startedMs = Date.now();
  const destRoot = backupRoot();
  mkdirSync(destRoot, { recursive: true });

  try {
    let filePath = "";

    if (process.platform === "win32") {
      const ps1 = join(root, "scripts", "backup-portfolio.ps1");
      if (existsSync(ps1)) {
        execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${ps1}"`, {
          cwd: root,
          stdio: "pipe",
        });
        const zips = listPortfolioFiles(destRoot).filter((x) => x.f.endsWith(".zip"));
        filePath = zips[0]?.full || "";
      }
    }

    if (!filePath) {
      const stamp = new Date()
        .toLocaleString("sv-SE", { hour12: false })
        .replace(/[-: ]/g, (c) => (c === " " ? "_" : ""))
        .replace(/\./g, "")
        .slice(0, 15);
      // fallback YYYYMMDD_HHmmss-ish from locale
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const stamp2 = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      void stamp;
      filePath = join(destRoot, `portfolio_${stamp2}.tar.gz`);
      spawnSync(
        "tar",
        [
          "-czf",
          filePath,
          "--exclude=node_modules",
          "--exclude=.next",
          "src",
          "public",
          "data",
          "scripts",
          "prisma",
          "package.json",
        ],
        { cwd: root, stdio: "pipe" },
      );
      if (!existsSync(filePath)) throw new Error("備份壓縮失敗");
    }

    const sizeBytes = statSync(filePath).size;
    const fileName = filePath.split(/[/\\]/).pop() || "";
    const label = labelFromBackupName(fileName);
    const { cloudFile, cloudDir, removed } = await uploadToCloud(filePath);
    pruneOldBackups(destRoot, KEEP_BACKUPS);
    const destination = `本機：${destRoot}｜雲端：${cloudDir}`;
    const pruneNote = removed.length ? `；雲端已刪除舊檔 ${removed.length} 個` : "";

    const record = await prisma.backupRecord.create({
      data: {
        type,
        result: "success",
        message: `備份時間 ${label}。耗時 ${Date.now() - startedMs} 毫秒。本機：${filePath}；雲端：${cloudFile}${pruneNote}`,
        sizeBytes,
        durationMs: Date.now() - startedMs,
        destination,
        filePath: `${fileName}（${label}）→ ${cloudFile}`,
        trigger,
      },
    });
    return { ok: true as const, record, sizeLabel: formatSize(sizeBytes), filePath, cloudFile, label };
  } catch (error) {
    const message = error instanceof Error ? error.message : "備份失敗";
    const record = await prisma.backupRecord.create({
      data: {
        type,
        result: "failed",
        message,
        durationMs: Date.now() - startedMs,
        destination: backupRoot(),
        trigger,
      },
    });
    return { ok: false as const, record, error: message };
  }
}

export async function getBackupSchedule() {
  return prisma.backupSchedule.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
}

async function shouldRunSlot(runAt: string) {
  if (!runAt || !/^\d{2}:\d{2}$/.test(runAt)) return false;
  const [hh, mm] = runAt.split(":").map(Number);
  const now = new Date();
  if (now.getHours() !== hh || now.getMinutes() !== mm) return false;

  const since = new Date(now);
  since.setSeconds(0, 0);
  const until = new Date(since.getTime() + 60_000);
  const recent = await prisma.backupRecord.findFirst({
    where: {
      trigger: "schedule",
      createdAt: { gte: since, lt: until },
    },
  });
  return !recent;
}

export async function maybeRunScheduledBackup() {
  if (backupJob.running) return null;

  const schedule = await getBackupSchedule();
  if (!schedule.enabled) return null;

  if (await shouldRunSlot(schedule.runAt)) {
    return startBackgroundBackup({ type: "SCHEDULED-1", trigger: "schedule" });
  }
  if (schedule.runAt2 && (await shouldRunSlot(schedule.runAt2))) {
    return startBackgroundBackup({ type: "SCHEDULED-2", trigger: "schedule" });
  }
  return null;
}

/** 伺服器進程內排程（不依賴有人開著後台頁面） */
export function ensureBackupScheduler() {
  if (schedulerStarted || typeof setInterval === "undefined") return;
  schedulerStarted = true;
  void maybeRunScheduledBackup();
  setInterval(() => {
    void maybeRunScheduledBackup();
  }, 30_000);
}

export async function listCloudBackups(limit = 10) {
  const cloudDir = await resolveCloudDir();
  return listPortfolioFiles(cloudDir)
    .slice(0, limit)
    .map((x) => ({
      name: x.f,
      label: labelFromBackupName(x.f),
      path: x.full,
      mtime: new Date(x.m).toISOString(),
      sizeBytes: statSync(x.full).size,
    }));
}
