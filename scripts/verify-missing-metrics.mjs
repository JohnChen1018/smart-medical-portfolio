/** Quick verify: load metrics for previously missing exp IDs from Drive */
import {
  aggregateMetricMaps,
  metricsToConfig,
  parseMeanStdSummaryCsv,
  parseResultsXlsxBuffer,
} from "../src/lib/wsiDriveMetrics.ts";

async function listPublicFolder(folderId) {
  const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${folderId}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const html = await res.text();
  const files = [];
  for (const m of html.matchAll(/id="entry-([^"]+)"[\s\S]*?flip-entry-title">([^<]+)/g)) {
    files.push({ id: m[1], name: m[2].trim() });
  }
  for (const file of files) {
    const block = html.match(new RegExp(`id="entry-${file.id}"[\\s\\S]*?(?=id="entry-|$)`));
    file.isFolder = block ? /folder-list-shared|folder-grid-shared|drive-sprite-folder/.test(block[0]) : false;
  }
  return files;
}

async function downloadText(fileId) {
  const res = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  return res.text();
}

async function downloadBin(fileId) {
  const res = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  return res.arrayBuffer();
}

const cases = [
  ["exp_028", "13scJjcBF5wnwVzK6tgX-XHLk6Nx_Caal"],
  ["exp_037", null],
  ["exp_039", null],
  ["exp_047", null],
  ["exp_002", null],
];

const s5 = "1HlmHLVR6-wRJqjshI12zr6oQ2cMU8iVJ";
const s9 = "15CQwAtJmIOHgXHi_bjoVhbmxx3Dk30t6";
const s8 = "1Pxxrk7hkW1DNwcctyWvO-aRJR3lbdcnO";
const s1y = "14dM_EtcKGhLt87SV39zhpO_9-5Xh_m6-";

async function loadExp(parentId, expName) {
  const parent = await listPublicFolder(parentId);
  const exp = parent.find((f) => f.name === expName);
  if (!exp) return null;
  const inner = await listPublicFolder(exp.id);
  const ms = inner.find((f) => f.name === "run11_mean_std");
  if (ms) {
    const msf = await listPublicFolder(ms.id);
    const csv = msf.find((f) => f.name === "summary_10runs_mean_std.csv");
    if (csv) {
      const configs = parseMeanStdSummaryCsv(await downloadText(csv.id), "test", parseInt(expName.replace(/\D/g, ""), 10));
      return configs[0]?.mPQ;
    }
  }
  const runs = inner.filter((f) => f.isFolder && /^run\d+$/i.test(f.name));
  const maps = [];
  for (const run of runs) {
    const rf = await listPublicFolder(run.id);
    const xlsx = rf.find((f) => f.name === "results_final_epoch.xlsx");
    if (!xlsx) continue;
    const m = parseResultsXlsxBuffer(await downloadBin(xlsx.id));
    if (m) maps.push(m);
  }
  const agg = aggregateMetricMaps(maps);
  if (!agg) return null;
  return metricsToConfig(parseInt(expName.replace(/\D/g, ""), 10), "test", "test", agg).mPQ;
}

console.log("exp_028", await loadExp("1k3oCXPchJL6IRj_5vAb5BBivjHt10gZZ", "exp_028") ?? "root direct");
console.log("exp_028 root", await loadExp("1k3oCXPchJL6IRj_5vAb5BBivjHt10gZZ", "exp_028"));
console.log("exp_037", await loadExp(s5, "exp_037"));
console.log("exp_038", await loadExp(s5, "exp_038"));
console.log("exp_039", await loadExp(s9, "exp_039"));
console.log("exp_047", await loadExp(s8, "exp_047"));
console.log("exp_002", await loadExp(s1y, "exp_002"));
console.log("exp_006", await loadExp("1KNpWSOK6GwNQ39S5jDrgBBkwAOOokEkC", "exp_006"));
