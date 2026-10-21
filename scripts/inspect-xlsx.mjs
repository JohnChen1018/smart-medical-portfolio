import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

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

async function downloadBin(fileId, out) {
  const res = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(out, buf);
}

const s1 = "14dM_EtcKGhLt87SV39zhpO_9-5Xh_m6-";
const ch = await listPublicFolder(s1);
const exp2 = ch.find((f) => f.name === "exp_002");
const runs = await listPublicFolder(exp2.id);
const run1 = runs.find((f) => f.name === "run1");
const runFiles = await listPublicFolder(run1.id);
const xlsx = runFiles.find((f) => f.name === "results_final_epoch.xlsx");
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "_tmp_results.xlsx");
await downloadBin(xlsx.id, out);
console.log("saved", out, fs.statSync(out).size);

try {
  const xml = execSync(`tar -tf "${out}" 2>nul || powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::OpenRead('${out.replace(/'/g, "''")}').Entries | ForEach-Object { $_.FullName }"`, { encoding: "utf8" });
  console.log(xml.slice(0, 500));
} catch (e) {
  console.log("list zip failed", e.message);
}
