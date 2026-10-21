import fs from "node:fs";
import path from "node:path";

const ROOT =
  "D:\\StarDist_6class_outputs_CoNIC_RandomPatch_80_10_10_NoOversampling_48configs_10runs_DualCheckpoint_50epochs";

function parseCsvLine(line) {
  const out = [];
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

function parseConfusionCsv(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const lines = fs.readFileSync(filePath, "utf8").trim().split(/\r?\n/);
  const header = parseCsvLine(lines[0]).slice(1);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const label = cols[0];
    const values = cols.slice(1).map(Number);
    rows.push({ label, values });
  }
  return { labels: header, rows };
}

function findConfusionMatrix(expDir) {
  const candidates = [];
  function walk(dir, depth = 0) {
    if (depth > 5) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isFile() && e.name === "confusion_matrix_normalized.csv") {
        candidates.push(full);
      } else if (e.isDirectory()) walk(full, depth + 1);
    }
  }
  walk(expDir);
  const finalEpoch = candidates.find((p) => p.includes("evaluation_final_epoch"));
  return parseConfusionCsv(finalEpoch ?? candidates[0] ?? null);
}

const students = fs
  .readdirSync(ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith("student"))
  .map((d) => d.name);

const configs = [];
const expFoldersFound = [];

for (const s of students) {
  const studentDir = path.join(ROOT, s);
  const csvPath = path.join(studentDir, "student_summary_10runs.csv");
  const expDirs = fs
    .readdirSync(studentDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^exp_/i.test(d.name))
    .map((d) => d.name);

  for (const expName of expDirs) {
    const expNum = parseInt(expName.replace(/\D/g, ""), 10);
    expFoldersFound.push({ studentFolder: s, expId: expNum, expFolder: expName });
  }

  if (!fs.existsSync(csvPath)) continue;
  const lines = fs.readFileSync(csvPath, "utf8").trim().split(/\r?\n/);
  const header = parseCsvLine(lines[0]);
  const idx = (name) => header.indexOf(name);
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length < header.length) continue;
    if (row[idx("checkpoint_type")] !== "final_epoch") continue;
    const num = (name) => Number(row[idx(name)]);
    const expId = num("exp_id");
    const expFolder = `exp_${String(expId).padStart(3, "0")}`;
    const expDir = path.join(studentDir, expFolder);
    const confusion = fs.existsSync(expDir) ? findConfusionMatrix(expDir) : null;
    configs.push({
      expId,
      studentFolder: s,
      expFolder,
      student: row[idx("student_name")],
      filterBase: num("unet_n_filter_base"),
      convAfter: num("net_conv_after_unet"),
      headBlocks: num("head_blocks"),
      lr: num("train_learning_rate"),
      lossWeights: row[idx("train_loss_weights")].replace(/"/g, ""),
      mPQ: num("mPQ+_mean"),
      pqNeu: num("PQ_Neutrophil_mean"),
      pqEpi: num("PQ_Epithelial_mean"),
      pqLym: num("PQ_Lymphocyte_mean"),
      pqPls: num("PQ_Plasma_mean"),
      pqEos: num("PQ_Eosinophil_mean"),
      pqCon: num("PQ_Connective_mean"),
      maskPQ: num("Mask_PQ_mean"),
      maskDQ: num("Mask_DQ_mean"),
      maskSQ: num("Mask_SQ_mean"),
      f1: num("Mask_F1_mean"),
      precision: num("Mask_Precision_mean"),
      recall: num("Mask_Recall_mean"),
      confusion,
    });
  }
}

configs.sort((a, b) => b.mPQ - a.mPQ);

let split = { train: 3984, valid: 498, test: 499 };
const classCounts = [
  { key: "neutrophil", zh: "嗜中性球 Neutrophil", count: 4012, pct: 0.9 },
  { key: "epithelial", zh: "上皮細胞 Epithelial", count: 222017, pct: 49.76 },
  { key: "lymphocyte", zh: "淋巴球 Lymphocyte", count: 93612, pct: 20.98 },
  { key: "plasma", zh: "漿細胞 Plasma", count: 24793, pct: 5.56 },
  { key: "eosinophil", zh: "嗜酸性球 Eosinophil", count: 2999, pct: 0.67 },
  { key: "connective", zh: "結締組織 Connective", count: 98783, pct: 22.14 },
];
const totalNuclei = classCounts.reduce((a, b) => a + b.count, 0);
const round = (n, d = 4) => Number(n.toFixed(d));

const cleanConfigs = configs.map((c, i) => ({
  rank: i + 1,
  expId: c.expId,
  studentFolder: c.studentFolder,
  expFolder: c.expFolder,
  student: c.student,
  filterBase: c.filterBase,
  convAfter: c.convAfter,
  headBlocks: c.headBlocks,
  lr: c.lr,
  lossWeights: c.lossWeights,
  mPQ: round(c.mPQ),
  pqNeu: round(c.pqNeu),
  pqEpi: round(c.pqEpi),
  pqLym: round(c.pqLym),
  pqPls: round(c.pqPls),
  pqEos: round(c.pqEos),
  pqCon: round(c.pqCon),
  maskPQ: round(c.maskPQ),
  maskDQ: round(c.maskDQ),
  maskSQ: round(c.maskSQ),
  f1: round(c.f1),
  precision: round(c.precision),
  recall: round(c.recall),
  confusion: c.confusion,
}));

const ts = `// AUTO-GENERATED by scripts/parse_all_results.mjs
export interface ConfusionMatrix {
  labels: string[];
  rows: { label: string; values: number[] }[];
}

export interface WsiConfig {
  rank: number;
  expId: number;
  studentFolder: string;
  expFolder: string;
  student: string;
  filterBase: number;
  convAfter: number;
  headBlocks: number;
  lr: number;
  lossWeights: string;
  mPQ: number;
  pqNeu: number;
  pqEpi: number;
  pqLym: number;
  pqPls: number;
  pqEos: number;
  pqCon: number;
  maskPQ: number;
  maskDQ: number;
  maskSQ: number;
  f1: number;
  precision: number;
  recall: number;
  confusion: ConfusionMatrix | null;
}

export const datasetSplit = { total: ${split.train + split.valid + split.test}, train: ${split.train}, valid: ${split.valid}, test: ${split.test} };
export const classCounts = ${JSON.stringify(classCounts, null, 2)};
export const totalNuclei = ${totalNuclei};
export const totalConfigsPlanned = 48;
export const expFoldersFound = ${JSON.stringify(expFoldersFound, null, 2)};
export const wsiConfigs: WsiConfig[] = ${JSON.stringify(cleanConfigs, null, 2)};
export const bestConfig = wsiConfigs[0];
export const lizardImageCount = ${split.train + split.valid + split.test};
`;

fs.writeFileSync("src/lib/wsiResults.ts", ts, "utf8");
console.log("configs:", cleanConfigs.length, "exp folders:", expFoldersFound.length, "best:", cleanConfigs[0]?.expId);
