import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { clearAllCached } from "@/lib/apiCache";
import { runPortfolioBackup } from "@/lib/backup-service";

const root = process.cwd();
const LOG_PATH = join(root, "data", "optimization_log.json");
const MAX_LOGS = 30;

export type OptimizeMetrics = {
  nextBytes: number;
  nextCacheBytes: number;
  dataBytes: number;
  srcBytes: number;
  apiCacheEntries: number;
  buildMs: number | null;
};

export type OptimizeLogEntry = {
  id: string;
  startedAt: string;
  finishedAt: string;
  ok: boolean;
  message: string;
  backupFile: string | null;
  backupLabel: string | null;
  before: OptimizeMetrics;
  after: OptimizeMetrics;
  saved: {
    diskBytes: number;
    buildMs: number | null;
    apiCacheEntries: number;
  };
  steps: string[];
};

type JobState = {
  running: boolean;
  startedAt: string | null;
  lastMessage: string | null;
};

const job: JobState = { running: false, startedAt: null, lastMessage: null };

export function getOptimizeJobStatus() {
  return { ...job };
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function dirSize(target: string): number {
  if (!existsSync(target)) return 0;
  let total = 0;
  const walk = (p: string) => {
    const st = statSync(p);
    if (st.isFile()) {
      total += st.size;
      return;
    }
    if (st.isDirectory()) {
      for (const name of readdirSync(p)) {
        try {
          walk(join(p, name));
        } catch {
          /* skip locked */
        }
      }
    }
  };
  walk(target);
  return total;
}

function readLogs(): OptimizeLogEntry[] {
  mkdirSync(join(root, "data"), { recursive: true });
  if (!existsSync(LOG_PATH)) return [];
  try {
    const raw = JSON.parse(readFileSync(LOG_PATH, "utf8")) as OptimizeLogEntry[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeLogs(entries: OptimizeLogEntry[]) {
  mkdirSync(join(root, "data"), { recursive: true });
  writeFileSync(LOG_PATH, JSON.stringify(entries.slice(0, MAX_LOGS), null, 2), "utf8");
}

export function listOptimizationLogs(limit = 20) {
  return readLogs().slice(0, limit);
}

function measure(): OptimizeMetrics {
  return {
    nextBytes: dirSize(join(root, ".next")),
    nextCacheBytes: dirSize(join(root, ".next", "cache")),
    dataBytes: dirSize(join(root, "data")),
    srcBytes: dirSize(join(root, "src")),
    apiCacheEntries: 0,
    buildMs: null,
  };
}

function clearNextCache(): number {
  const cacheDir = join(root, ".next", "cache");
  if (!existsSync(cacheDir)) return 0;
  const bytes = dirSize(cacheDir);
  try {
    rmSync(cacheDir, { recursive: true, force: true });
  } catch {
    return 0;
  }
  return bytes;
}

function runProductionBuild(): { ok: boolean; ms: number; error?: string } {
  const t0 = Date.now();
  const result = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], {
    cwd: root,
    stdio: "pipe",
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  const ms = Date.now() - t0;
  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || "").slice(-800);
    return { ok: false, ms, error: err || `build exit ${result.status}` };
  }
  return { ok: true, ms };
}

export async function runPortfolioOptimize(trigger = "manual"): Promise<OptimizeLogEntry> {
  const startedAt = new Date().toISOString();
  const steps: string[] = [];
  const before = measure();

  steps.push("備份專案（優化前強制）");
  const backup = await runPortfolioBackup({ type: "PRE-OPTIMIZE", trigger: `optimize-${trigger}` });
  if (!backup.ok) {
    const entry: OptimizeLogEntry = {
      id: randomUUID(),
      startedAt,
      finishedAt: new Date().toISOString(),
      ok: false,
      message: `備份失敗，已中止優化：${backup.error || backup.record?.message}`,
      backupFile: null,
      backupLabel: null,
      before,
      after: before,
      saved: { diskBytes: 0, buildMs: null, apiCacheEntries: 0 },
      steps,
    };
    const logs = readLogs();
    writeLogs([entry, ...logs]);
    return entry;
  }

  const backupFile = backup.filePath?.split(/[/\\]/).pop() || null;
  const backupLabel = backup.label || backupFile;

  steps.push("清除 .next 建置快取");
  const cacheCleared = clearNextCache();

  steps.push("清除 API 記憶體快取");
  const apiCleared = clearAllCached();

  steps.push("執行 production build（next build）");
  const build = runProductionBuild();
  if (!build.ok) {
    const afterFail = measure();
    afterFail.buildMs = build.ms;
    const entry: OptimizeLogEntry = {
      id: randomUUID(),
      startedAt,
      finishedAt: new Date().toISOString(),
      ok: false,
      message: `建置失敗：${build.error}`,
      backupFile,
      backupLabel,
      before,
      after: afterFail,
      saved: { diskBytes: cacheCleared, buildMs: null, apiCacheEntries: apiCleared },
      steps,
    };
    const logs = readLogs();
    writeLogs([entry, ...logs]);
    return entry;
  }

  const after = measure();
  after.buildMs = build.ms;
  after.apiCacheEntries = 0;

  const prevBuild = readLogs().find((l) => l.ok && l.after.buildMs != null)?.after.buildMs ?? null;
  const diskSaved = Math.max(0, before.nextBytes - after.nextBytes) + cacheCleared;
  const buildSaved = prevBuild != null && build.ms < prevBuild ? prevBuild - build.ms : null;

  const entry: OptimizeLogEntry = {
    id: randomUUID(),
    startedAt,
    finishedAt: new Date().toISOString(),
    ok: true,
    message: `優化完成。釋放磁碟約 ${formatSize(diskSaved)}${buildSaved != null ? `，建置較上次快 ${(buildSaved / 1000).toFixed(1)} 秒` : ""}。備份：${backupLabel}`,
    backupFile,
    backupLabel,
    before,
    after,
    saved: { diskBytes: diskSaved, buildMs: buildSaved, apiCacheEntries: apiCleared },
    steps,
  };

  const logs = readLogs();
  writeLogs([entry, ...logs]);
  return entry;
}

export function startBackgroundOptimize(trigger = "manual") {
  if (job.running) {
    return { started: false as const, running: true, message: "優化進行中" };
  }

  job.running = true;
  job.startedAt = new Date().toISOString();
  job.lastMessage = "優化進行中（含備份與建置，可能需要數分鐘）…";

  void runPortfolioOptimize(trigger)
    .then((entry) => {
      job.lastMessage = entry.message;
    })
    .catch((err) => {
      job.lastMessage = err instanceof Error ? err.message : "優化失敗";
    })
    .finally(() => {
      job.running = false;
    });

  return { started: true as const, running: true, message: "已開始優化，可先切換其他頁面" };
}

export { formatSize as formatOptimizeSize };
