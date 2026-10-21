import { NextResponse } from "next/server";
import { getCached, setCached } from "@/lib/apiCache";
import {
  downloadDriveBinary,
  downloadDriveText,
  getWsiRootFolderId,
  listDriveFolder,
  usesDriveApiKey,
  type DriveFile,
} from "@/lib/googleDrive";
import {
  aggregateMetricMaps,
  configNeedsHyperparams,
  configNeedsSupplementary,
  mergeConfigsByExpId,
  mergeDriveConfigFields,
  metricsToConfig,
  parseMeanStdSummaryCsv,
  parseResultsXlsxBuffer,
  parseStudentSummaryCsv,
  type WsiConfigFromDrive,
} from "@/lib/wsiDriveMetrics";
import { wsiRootDriveExperiments } from "@/lib/wsiRootExperiments";
import { hyperparamsFromGrid } from "@/lib/wsiHyperparamGrid";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface ExpFolder {
  studentFolder: string;
  expId: number;
  expFolder: string;
  driveFolderId: string;
  hasSummary: boolean;
}

function isFolder(entry: DriveFile) {
  return entry.mimeType === "application/vnd.google-apps.folder";
}

function expNumFromName(name: string) {
  return parseInt(name.replace(/\D/g, ""), 10);
}

async function loadHyperparamsFromRuns(children: DriveFile[]) {
  const runs = children
    .filter((f) => isFolder(f) && /^run\d+$/i.test(f.name))
    .sort((a, b) => expNumFromName(a.name) - expNumFromName(b.name));

  for (const run of runs) {
    const runFiles = await listDriveFolder(run.id);
    const xlsx = runFiles.find((f) => f.name === "results_final_epoch.xlsx");
    if (!xlsx) continue;
    try {
      const { data } = await downloadDriveBinary(xlsx.id);
      const parsed = parseResultsXlsxBuffer(data);
      if (Object.keys(parsed.hyperparams).length) return parsed.hyperparams;
    } catch {
      /* skip broken run */
    }
  }
  return {} as Record<string, number | string>;
}

async function loadRunAggregates(children: DriveFile[]) {
  const runs = children
    .filter((f) => isFolder(f) && /^run\d+$/i.test(f.name))
    .sort((a, b) => expNumFromName(a.name) - expNumFromName(b.name));

  const metricMaps: Record<string, number>[] = [];
  let runHyperparams: Record<string, number | string> = {};

  for (const run of runs) {
    const runFiles = await listDriveFolder(run.id);
    const xlsx = runFiles.find((f) => f.name === "results_final_epoch.xlsx");
    if (!xlsx) continue;
    try {
      const { data } = await downloadDriveBinary(xlsx.id);
      const parsed = parseResultsXlsxBuffer(data);
      if (parsed.metrics) {
        metricMaps.push({
          ...parsed.metrics,
          ...(parsed.supplementary ?? {}),
        });
      }
      if (!Object.keys(runHyperparams).length && Object.keys(parsed.hyperparams).length) {
        runHyperparams = parsed.hyperparams;
      }
    } catch {
      /* skip broken run */
    }
  }

  return {
    agg: aggregateMetricMaps(metricMaps),
    runHyperparams,
  };
}

async function tryLoadExpMetrics(
  studentFolder: string,
  expId: number,
  expFolderId: string,
): Promise<{ configs: WsiConfigFromDrive[]; hasSummary: boolean }> {
  const children = await listDriveFolder(expFolderId);
  const hyperparams = await loadHyperparamsFromRuns(children);
  const meanStd = children.find((f) => isFolder(f) && f.name === "run11_mean_std");
  if (meanStd) {
    const msChildren = await listDriveFolder(meanStd.id);
    const csv = msChildren.find((f) => f.name === "summary_10runs_mean_std.csv");
    if (csv) {
      try {
        const text = await downloadDriveText(csv.id);
        let configs = parseMeanStdSummaryCsv(text, studentFolder, expId).map((c) =>
          mergeDriveConfigFields(c, metricsToConfig(expId, studentFolder, c.student, {}, hyperparams)),
        );
        if (configs.length) {
          // CSV 常缺 mean_F1 / TP / FP / FN：再從各 run xlsx 補齊後平均
          if (configs.some(configNeedsSupplementary)) {
            const { agg, runHyperparams } = await loadRunAggregates(children);
            if (agg) {
              const fromRuns = metricsToConfig(
                expId,
                studentFolder,
                configs[0].student,
                agg,
                Object.keys(runHyperparams).length ? runHyperparams : hyperparams,
              );
              configs = configs.map((c) => mergeDriveConfigFields(c, fromRuns));
            }
          }
          return { configs, hasSummary: true };
        }
      } catch {
        /* ignore */
      }
    }
  }

  const { agg, runHyperparams } = await loadRunAggregates(children);
  if (!agg) return { configs: [], hasSummary: false };
  return {
    configs: [
      metricsToConfig(
        expId,
        studentFolder,
        studentFolder,
        agg,
        Object.keys(runHyperparams).length ? runHyperparams : hyperparams,
      ),
    ],
    hasSummary: true,
  };
}

async function enrichConfigHyperparams(
  cfg: WsiConfigFromDrive,
  expFolderId: string,
): Promise<WsiConfigFromDrive> {
  if (!configNeedsHyperparams(cfg)) return cfg;
  const children = await listDriveFolder(expFolderId);
  const hyperparams = await loadHyperparamsFromRuns(children);
  if (!Object.keys(hyperparams).length) return cfg;
  return mergeDriveConfigFields(cfg, metricsToConfig(cfg.expId, cfg.studentFolder, cfg.student, {}, hyperparams));
}

async function scanStudentFolder(studentName: string, studentId: string): Promise<{
  folders: ExpFolder[];
  configs: WsiConfigFromDrive[];
}> {
  const folders: ExpFolder[] = [];
  const configs: WsiConfigFromDrive[] = [];
  const configExpIds = new Set<number>();

  const children = await listDriveFolder(studentId);
  const csvFile = children.find((f) => f.name === "student_summary_10runs.csv");

  if (csvFile) {
    try {
      const csv = await downloadDriveText(csvFile.id);
      for (const c of parseStudentSummaryCsv(csv, studentName)) {
        configs.push(c);
        configExpIds.add(c.expId);
      }
    } catch {
      /* ignore csv errors */
    }
  }

  const expChildren = children.filter((f) => isFolder(f) && /^exp_/i.test(f.name));

  for (const child of expChildren) {
    const expId = expNumFromName(child.name);
    let hasSummary = configExpIds.has(expId);

    if (!configExpIds.has(expId)) {
      const perExpCsv = (await listDriveFolder(child.id)).find(
        (f) => f.name === "student_summary_10runs.csv",
      );
      if (perExpCsv) {
        try {
          const csv = await downloadDriveText(perExpCsv.id);
          for (const c of parseStudentSummaryCsv(csv, studentName, expId)) {
            configs.push(c);
            configExpIds.add(c.expId);
            hasSummary = true;
          }
        } catch {
          /* ignore */
        }
      }
    }

    if (!configExpIds.has(expId)) {
      const loaded = await tryLoadExpMetrics(studentName, expId, child.id);
      for (const c of loaded.configs) {
        configs.push(c);
        configExpIds.add(c.expId);
      }
      hasSummary = hasSummary || loaded.hasSummary;
    }

    folders.push({
      studentFolder: studentName,
      expId,
      expFolder: child.name,
      driveFolderId: child.id,
      hasSummary,
    });

    const existing = configs.find((c) => c.expId === expId);
    if (existing && configNeedsHyperparams(existing)) {
      const enriched = await enrichConfigHyperparams(existing, child.id);
      const idx = configs.findIndex((c) => c.expId === expId);
      if (idx >= 0) configs[idx] = enriched;
    }
  }

  return { folders, configs };
}

async function scanRootProject(def: (typeof wsiRootDriveExperiments)[number]): Promise<{
  folders: ExpFolder[];
  configs: WsiConfigFromDrive[];
}> {
  const folders: ExpFolder[] = [];
  const configs: WsiConfigFromDrive[] = [];

  const rootChildren = await listDriveFolder(def.rootFolderId);
  const studentDir = rootChildren.find((f) => isFolder(f) && /^student/i.test(f.name));

  // 找到真正包含 run1..run10 的 exp_ 資料夾（可能在根層或 student 子層）。
  let runsFolderId = rootChildren.find((f) => isFolder(f) && /^exp_/i.test(f.name))?.id;
  let studentChildren: DriveFile[] | null = null;
  if (studentDir) {
    studentChildren = await listDriveFolder(studentDir.id);
    if (!runsFolderId) {
      runsFolderId = studentChildren.find((f) => isFolder(f) && /^exp_/i.test(f.name))?.id;
    }
  }
  const driveFolderId = runsFolderId ?? studentDir?.id ?? def.rootFolderId;

  if (studentChildren) {
    const csvFile = studentChildren.find((f) => f.name === "student_summary_10runs.csv");
    if (csvFile) {
      try {
        const csv = await downloadDriveText(csvFile.id);
        configs.push(...parseStudentSummaryCsv(csv, def.studentFolder, def.expId));
      } catch {
        /* ignore */
      }
    }
  }

  if (!configs.some((c) => c.expId === def.expId)) {
    const loaded = await tryLoadExpMetrics(def.studentFolder, def.expId, driveFolderId);
    configs.push(...loaded.configs);
  }

  folders.push({
    studentFolder: def.studentFolder,
    expId: def.expId,
    expFolder: def.expFolder,
    driveFolderId,
    hasSummary: configs.some((c) => c.expId === def.expId),
  });

  return { folders, configs };
}

async function scanRootExpFolder(name: string, folderId: string): Promise<{
  folder: ExpFolder;
  configs: WsiConfigFromDrive[];
}> {
  const expId = expNumFromName(name);
  const loaded = await tryLoadExpMetrics("cloud_root", expId, folderId);
  return {
    folder: {
      studentFolder: "cloud_root",
      expId,
      expFolder: name,
      driveFolderId: folderId,
      hasSummary: loaded.hasSummary,
    },
    configs: loaded.configs,
  };
}

async function mapPool<T, R>(items: T[], fn: (item: T) => Promise<R>, concurrency = 4): Promise<R[]> {
  const results: R[] = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

export async function GET() {
  const CACHE_KEY = "gdrive-experiments";
  const CACHE_TTL_MS = 5 * 60 * 1000;
  const cached = getCached<Record<string, unknown>>(CACHE_KEY, CACHE_TTL_MS);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const rootId = getWsiRootFolderId();
    const rootItems = await listDriveFolder(rootId);
    const studentFolders = rootItems.filter((f) => isFolder(f) && /^student/i.test(f.name));

    const scans = await mapPool(studentFolders, (student) =>
      scanStudentFolder(student.name, student.id),
    );

    const rootScans = await mapPool([...wsiRootDriveExperiments], (def) => scanRootProject(def));

    const rootExpItems = rootItems.filter((f) => isFolder(f) && /^exp_\d+$/i.test(f.name));
    const rootExpScans = await mapPool(rootExpItems, (f) => scanRootExpFolder(f.name, f.id));

    const allFolders = [
      ...scans.flatMap((s) => s.folders),
      ...rootScans.flatMap((s) => s.folders),
      ...rootExpScans.map((s) => s.folder),
    ];
    const allConfigs = [
      ...scans.flatMap((s) => s.configs),
      ...rootScans.flatMap((s) => s.configs),
      ...rootExpScans.flatMap((s) => s.configs),
    ];

    const deduped = mergeConfigsByExpId(allConfigs);
    const uniqueConfigs = deduped;

    const enrichedConfigs: WsiConfigFromDrive[] = [];
    for (const cfg of uniqueConfigs) {
      if (!configNeedsHyperparams(cfg)) {
        enrichedConfigs.push(cfg);
        continue;
      }
      const folder =
        allFolders.find((f) => f.expId === cfg.expId && f.studentFolder === cfg.studentFolder) ??
        allFolders.find((f) => f.expId === cfg.expId);
      if (folder?.driveFolderId) {
        enrichedConfigs.push(await enrichConfigHyperparams(cfg, folder.driveFolderId));
      } else {
        enrichedConfigs.push(cfg);
      }
    }
    const finalConfigs = enrichedConfigs
      .map((cfg) => {
        const grid = hyperparamsFromGrid(cfg.expId);
        return grid ? mergeDriveConfigFields(cfg, grid) : cfg;
      })
      .sort((a, b) => b.mPQ - a.mPQ);

    const configIds = new Set(finalConfigs.map((c) => c.expId));
    const missing = [];
    for (let i = 1; i <= 50; i++) {
      if (!configIds.has(i)) missing.push(i);
    }

    const payload = {
      connected: true,
      mode: usesDriveApiKey() ? "api" : "public",
      rootFolderId: rootId,
      rootProjectCount: wsiRootDriveExperiments.length,
      expFoldersFound: allFolders,
      wsiConfigs: finalConfigs,
      bestConfig: finalConfigs[0] ?? null,
      missingExpIds: missing,
      updatedAt: new Date().toISOString(),
    };
    setCached(CACHE_KEY, payload);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google Drive 連線失敗";
    return NextResponse.json(
      {
        connected: false,
        error: message,
        expFoldersFound: [],
        wsiConfigs: [],
        updatedAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  }
}
