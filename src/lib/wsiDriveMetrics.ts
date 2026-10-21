import { inflateRawSync, inflateSync } from "node:zlib";

export interface WsiConfigFromDrive {
  expId: number;
  studentFolder: string;
  expFolder: string;
  student: string;
  filterBase?: number;
  convAfter?: number;
  headBlocks?: number;
  lr?: number;
  lossWeights?: string;
  mPQ: number;
  pqNeu?: number;
  pqEpi?: number;
  pqLym?: number;
  pqPls?: number;
  pqEos?: number;
  pqCon?: number;
  maskPQ: number;
  maskDQ: number;
  maskSQ: number;
  precision: number;
  recall: number;
  f1: number;
  /** 論文 12 指標 · mAP@50 segmentation */
  map50Segm?: number;
  /** 論文 12 指標 · mAP@50 bbox */
  map50Bbox?: number;
  /** 論文未列 · sheet3 extra：mean_F1@50_95 */
  meanF1At5095?: number;
  /** 論文未列 · sheet3 extra */
  tp?: number;
  fp?: number;
  fn?: number;
  /** 論文未列 · sheet4：全 patch 256×256 計數 R² */
  mR2FullImage?: number;
  /** 論文未列 · sheet4：全 patch 256×256 計數 MAE */
  mMAEFullImage?: number;
  source: "gdrive";
}

export type WsiSupplementaryFields = Pick<
  WsiConfigFromDrive,
  "meanF1At5095" | "tp" | "fp" | "fn" | "mR2FullImage" | "mMAEFullImage"
>;

function pickNum(m: Record<string, number>, ...keys: string[]) {
  for (const k of keys) {
    const v = m[k];
    if (v != null && !Number.isNaN(v)) return v;
  }
  return undefined;
}

export function parseCsvLine(line: string) {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function readZipEntry(buf: Buffer, entryName: string): Buffer | null {
  let offset = 0;
  while (offset < buf.length - 30) {
    const sig = buf.readUInt32LE(offset);
    if (sig !== 0x04034b50) break;
    const compMethod = buf.readUInt16LE(offset + 8);
    const compSize = buf.readUInt32LE(offset + 18);
    const fileNameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const name = buf.subarray(offset + 30, offset + 30 + fileNameLen).toString("utf8");
    const dataStart = offset + 30 + fileNameLen + extraLen;
    const compData = buf.subarray(dataStart, dataStart + compSize);
    if (name === entryName) {
      if (compMethod === 0) return Buffer.from(compData);
      if (compMethod === 8) {
        try {
          return Buffer.from(inflateRawSync(compData));
        } catch {
          return Buffer.from(inflateSync(compData));
        }
      }
    }
    offset = dataStart + compSize;
  }
  return null;
}

function parseSharedStrings(xml: string): string[] {
  return [...xml.matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((m) => m[1]);
}

function parseMetricSheet(xml: string, shared: string[]): Record<string, number> {
  const rows = [...xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)];
  const metrics: Record<string, number> = {};
  for (const row of rows) {
    const cells = [...row[1].matchAll(/<c r="([A-Z]+)(\d+)"([^>]*)>([\s\S]*?)<\/c>/g)];
    let key = "";
    let val = "";
    for (const c of cells) {
      const col = c[1];
      const type = /t="s"/.test(c[3]) ? "s" : "n";
      const vMatch = c[4].match(/<v>([^<]*)<\/v>/);
      const tMatch = c[4].match(/<t[^>]*>([^<]*)<\/t>/);
      let cell = "";
      if (tMatch) cell = tMatch[1];
      else if (vMatch) cell = type === "s" ? shared[Number(vMatch[1])] ?? vMatch[1] : vMatch[1];
      if (col === "A") key = cell;
      if (col === "B") val = cell;
    }
    if (key && val && key !== "metric" && !key.startsWith("extra")) {
      const n = Number(val);
      if (!Number.isNaN(n)) metrics[key] = n;
    }
  }
  return metrics;
}

export function parseResultsXlsxBuffer(buf: ArrayBuffer): {
  metrics: Record<string, number> | null;
  supplementary: Record<string, number> | null;
  hyperparams: Record<string, number | string>;
} {
  const zip = Buffer.from(buf);
  const sharedXml = readZipEntry(zip, "xl/sharedStrings.xml");
  const shared = sharedXml ? parseSharedStrings(sharedXml.toString("utf8")) : [];

  const sheetXml = readZipEntry(zip, "xl/worksheets/sheet3.xml");
  const metrics = sheetXml
    ? parseMetricSheet(sheetXml.toString("utf8"), shared)
    : null;

  const supSheet = readZipEntry(zip, "xl/worksheets/sheet4.xml");
  const supplementary = supSheet
    ? parseMetricSheet(supSheet.toString("utf8"), shared)
    : null;

  const hpSheet = readZipEntry(zip, "xl/worksheets/sheet2.xml");
  const hyperparams: Record<string, number | string> = {};
  if (hpSheet) {
    const rows = [...hpSheet.toString("utf8").matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)];
    for (const row of rows.slice(1)) {
      const cells = [...row[1].matchAll(/<c r="([A-Z]+)(\d+)"([^>]*)>([\s\S]*?)<\/c>/g)];
      let key = "";
      let val: string | number = "";
      for (const c of cells) {
        const col = c[1];
        const type = /t="s"/.test(c[3]) ? "s" : "n";
        const vMatch = c[4].match(/<v>([^<]*)<\/v>/);
        const tMatch = c[4].match(/<t[^>]*>([^<]*)<\/t>/);
        let cell = "";
        if (tMatch) cell = tMatch[1];
        else if (vMatch) cell = type === "s" ? shared[Number(vMatch[1])] ?? vMatch[1] : vMatch[1];
        if (col === "A") key = cell;
        if (col === "B") val = type === "n" ? Number(cell) : cell;
      }
      if (key && val !== "") hyperparams[key] = val;
    }
  }

  return {
    metrics: metrics && Object.keys(metrics).length ? metrics : null,
    supplementary: supplementary && Object.keys(supplementary).length ? supplementary : null,
    hyperparams,
  };
}

function supplementaryFromMetrics(m: Record<string, number>): WsiSupplementaryFields {
  return {
    meanF1At5095: pickNum(m, "mean_F1@50_95", "mean_F1@50_95_mean"),
    tp: pickNum(m, "TP", "TP_mean"),
    fp: pickNum(m, "FP", "FP_mean"),
    fn: pickNum(m, "FN", "FN_mean"),
    mR2FullImage: pickNum(m, "mR2_full_image", "mR2_full_image_mean"),
    mMAEFullImage: pickNum(m, "mMAE_full_image", "mMAE_full_image_mean"),
  };
}

function mean(nums: number[]) {
  if (!nums.length) return NaN;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function sanitizeLossWeights(v: unknown): string | undefined {
  if (v == null || v === "") return undefined;
  const s = String(v).replace(/"/g, "").trim();
  if (!s || s === "—" || s.toLowerCase() === "nan") return undefined;
  if (s.startsWith("[")) return s;
  const n = Number(s);
  if (Number.isNaN(n)) return undefined;
  return s;
}

function hyperFromRecord(h: Record<string, number | string>) {
  return {
    filterBase: Number(h.unet_n_filter_base) || undefined,
    convAfter: Number(h.net_conv_after_unet) || undefined,
    headBlocks: Number(h.head_blocks) || undefined,
    lr: Number(h.train_learning_rate) || undefined,
    lossWeights: sanitizeLossWeights(h.train_loss_weights),
  };
}

export function mergeDriveConfigFields(
  target: WsiConfigFromDrive,
  source: Partial<WsiConfigFromDrive>,
): WsiConfigFromDrive {
  return {
    ...target,
    filterBase: target.filterBase || source.filterBase,
    convAfter: target.convAfter || source.convAfter,
    headBlocks: target.headBlocks || source.headBlocks,
    lr: target.lr || source.lr,
    lossWeights: sanitizeLossWeights(target.lossWeights) ?? sanitizeLossWeights(source.lossWeights),
    meanF1At5095: target.meanF1At5095 ?? source.meanF1At5095,
    tp: target.tp ?? source.tp,
    fp: target.fp ?? source.fp,
    fn: target.fn ?? source.fn,
    mR2FullImage: target.mR2FullImage ?? source.mR2FullImage,
    mMAEFullImage: target.mMAEFullImage ?? source.mMAEFullImage,
    map50Segm: target.map50Segm ?? source.map50Segm,
    map50Bbox: target.map50Bbox ?? source.map50Bbox,
    precision: Number.isFinite(target.precision) ? target.precision : (source.precision ?? target.precision),
    recall: Number.isFinite(target.recall) ? target.recall : (source.recall ?? target.recall),
    f1: Number.isFinite(target.f1) ? target.f1 : (source.f1 ?? target.f1),
  };
}

export function configNeedsHyperparams(c: WsiConfigFromDrive) {
  return !c.filterBase || !c.convAfter || !c.headBlocks || !c.lr || !sanitizeLossWeights(c.lossWeights);
}

/** CSV 常缺補充欄位時，需再從各 run 的 xlsx 補齊。 */
export function configNeedsSupplementary(c: WsiConfigFromDrive) {
  return (
    c.meanF1At5095 == null ||
    c.tp == null ||
    c.fp == null ||
    c.fn == null ||
    c.mR2FullImage == null ||
    c.mMAEFullImage == null
  );
}

export function mergeConfigsByExpId(configs: WsiConfigFromDrive[]): WsiConfigFromDrive[] {
  const byExp = new Map<number, WsiConfigFromDrive[]>();
  for (const c of configs) {
    if (!c.expId || Number.isNaN(c.mPQ)) continue;
    const list = byExp.get(c.expId) ?? [];
    list.push(c);
    byExp.set(c.expId, list);
  }

  const merged: WsiConfigFromDrive[] = [];
  for (const list of byExp.values()) {
    const sorted = [...list].sort((a, b) => b.mPQ - a.mPQ);
    let best = sorted[0];
    for (const c of sorted.slice(1)) {
      best = mergeDriveConfigFields(best.mPQ >= c.mPQ ? best : c, best.mPQ >= c.mPQ ? c : best);
    }
    merged.push(best);
  }
  return merged.sort((a, b) => b.mPQ - a.mPQ);
}

export function metricsToConfig(
  expId: number,
  studentFolder: string,
  student: string,
  m: Record<string, number>,
  hyper?: Record<string, number | string>,
): WsiConfigFromDrive {
  return {
    expId,
    studentFolder,
    expFolder: `exp_${String(expId).padStart(2, "0")}`,
    student,
    ...hyperFromRecord(hyper ?? {}),
    mPQ: m["mPQ+"] ?? NaN,
    pqNeu: pickNum(m, "PQ_Neutrophil", "PQ_neu"),
    pqEpi: pickNum(m, "PQ_Epithelial", "PQ_epi"),
    pqLym: pickNum(m, "PQ_Lymphocyte", "PQ_lym"),
    pqPls: pickNum(m, "PQ_Plasma", "PQ_pls"),
    pqEos: pickNum(m, "PQ_Eosinophil", "PQ_eos"),
    pqCon: pickNum(m, "PQ_Connective", "PQ_con"),
    maskPQ: m.Mask_PQ ?? NaN,
    maskDQ: m.Mask_DQ ?? NaN,
    maskSQ: m.Mask_SQ ?? NaN,
    precision: m.Mask_Precision ?? NaN,
    recall: m.Mask_Recall ?? NaN,
    f1: m.Mask_F1 ?? NaN,
    map50Segm: pickNum(m, "mAP@50_segm", "mAP50_segm", "map50_segm"),
    map50Bbox: pickNum(m, "mAP@50_bbox", "mAP50_bbox", "map50_bbox"),
    ...supplementaryFromMetrics(m),
    source: "gdrive",
  };
}

export function parseStudentSummaryCsv(
  csv: string,
  studentName: string,
  forceExpId?: number,
): WsiConfigFromDrive[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = parseCsvLine(lines[0]);
  const idx = (name: string) => header.indexOf(name);
  const finalEpoch = new Map<number, WsiConfigFromDrive>();
  const bestVal = new Map<number, WsiConfigFromDrive>();

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    const ck = row[idx("checkpoint_type")];
    if (ck !== "final_epoch" && ck !== "best_validation") continue;
    const expId = forceExpId ?? Number(row[idx("exp_id")]);
    if (!expId || Number.isNaN(expId)) continue;

    const numAt = (...names: string[]) => {
      for (const name of names) {
        const i = idx(name);
        if (i < 0) continue;
        const n = Number(row[i]);
        if (!Number.isNaN(n)) return n;
      }
      return undefined;
    };
    const cfg: WsiConfigFromDrive = {
      expId,
      studentFolder: studentName,
      expFolder: `exp_${String(expId).padStart(2, "0")}`,
      student: row[idx("student_name")] ?? studentName,
      filterBase: Number(row[idx("unet_n_filter_base")]) || undefined,
      convAfter: Number(row[idx("net_conv_after_unet")]) || undefined,
      headBlocks: Number(row[idx("head_blocks")]) || undefined,
      lr: Number(row[idx("train_learning_rate")]) || undefined,
      lossWeights: sanitizeLossWeights(row[idx("train_loss_weights")]),
      mPQ: Number(row[idx("mPQ+_mean")]),
      pqNeu: numAt("PQ_Neutrophil_mean", "PQ_Neutrophil"),
      pqEpi: numAt("PQ_Epithelial_mean", "PQ_Epithelial"),
      pqLym: numAt("PQ_Lymphocyte_mean", "PQ_Lymphocyte"),
      pqPls: numAt("PQ_Plasma_mean", "PQ_Plasma"),
      pqEos: numAt("PQ_Eosinophil_mean", "PQ_Eosinophil"),
      pqCon: numAt("PQ_Connective_mean", "PQ_Connective"),
      maskPQ: Number(row[idx("Mask_PQ_mean")]),
      maskDQ: Number(row[idx("Mask_DQ_mean")]),
      maskSQ: Number(row[idx("Mask_SQ_mean")]),
      precision: Number(row[idx("Mask_Precision_mean")]),
      recall: Number(row[idx("Mask_Recall_mean")]),
      f1: Number(row[idx("Mask_F1_mean")]),
      map50Segm: numAt("mAP@50_segm_mean", "mAP@50_segm"),
      map50Bbox: numAt("mAP@50_bbox_mean", "mAP@50_bbox"),
      meanF1At5095: numAt("mean_F1@50_95_mean", "mean_F1@50_95"),
      tp: numAt("TP_mean", "TP"),
      fp: numAt("FP_mean", "FP"),
      fn: numAt("FN_mean", "FN"),
      mR2FullImage: numAt("mR2_full_image_mean", "mR2_full_image"),
      mMAEFullImage: numAt("mMAE_full_image_mean", "mMAE_full_image"),
      source: "gdrive",
    };

    if (ck === "final_epoch") finalEpoch.set(expId, cfg);
    else bestVal.set(expId, cfg);
  }

  const out: WsiConfigFromDrive[] = [];
  const allIds = new Set([...finalEpoch.keys(), ...bestVal.keys()]);
  for (const expId of allIds) {
    out.push(finalEpoch.get(expId) ?? bestVal.get(expId)!);
  }
  return out;
}

export function parseMeanStdSummaryCsv(
  csv: string,
  studentName: string,
  forceExpId?: number,
): WsiConfigFromDrive[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = parseCsvLine(lines[0]);
  const idx = (name: string) => header.indexOf(name);
  const groups = new Map<string, { expId: number; student: string; ck: string; metrics: Record<string, number> }>();

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    const ck = row[idx("checkpoint_type")];
    if (ck !== "final_epoch" && ck !== "best_validation") continue;
    const expId = forceExpId ?? Number(row[idx("exp_id")]);
    const metric = row[idx("metric")];
    const val = Number(row[idx("mean")]);
    if (!metric || Number.isNaN(val)) continue;
    const key = `${expId}:${ck}`;
    const g = groups.get(key) ?? {
      expId,
      student: row[idx("student_name")] ?? studentName,
      ck,
      metrics: {},
    };
    g.metrics[metric] = val;
    groups.set(key, g);
  }

  const byExp = new Map<number, WsiConfigFromDrive>();
  for (const g of groups.values()) {
    const cfg = metricsToConfig(g.expId, studentName, g.student, g.metrics);
    if (Number.isNaN(cfg.mPQ)) continue;
    const prev = byExp.get(g.expId);
    if (!prev || g.ck === "final_epoch") byExp.set(g.expId, cfg);
  }
  return [...byExp.values()];
}

export function aggregateMetricMaps(maps: Record<string, number>[]): Record<string, number> | null {
  if (!maps.length) return null;
  const keys = [
    "mPQ+",
    "Mask_PQ",
    "Mask_DQ",
    "Mask_SQ",
    "Mask_Precision",
    "Mask_Recall",
    "Mask_F1",
    "PQ_Neutrophil",
    "PQ_Epithelial",
    "PQ_Lymphocyte",
    "PQ_Plasma",
    "PQ_Eosinophil",
    "PQ_Connective",
    "mAP@50_segm",
    "mAP@50_bbox",
    "mean_F1@50_95",
    "TP",
    "FP",
    "FN",
    "mR2_full_image",
    "mMAE_full_image",
  ];
  const out: Record<string, number> = {};
  for (const key of keys) {
    const vals = maps.map((m) => m[key]).filter((v) => v != null && !Number.isNaN(v));
    if (vals.length) out[key] = mean(vals);
  }
  return Object.keys(out).length ? out : null;
}
