import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(dir, "_tmp_xlsx");

function readSharedStrings() {
  const p = path.join(outDir, "xl", "sharedStrings.xml");
  if (!fs.existsSync(p)) return [];
  const xml = fs.readFileSync(p, "utf8");
  return [...xml.matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((m) => m[1]);
}

function parseSheet(sheetName, shared) {
  const xml = fs.readFileSync(path.join(outDir, "xl", "worksheets", sheetName), "utf8");
  const rows = [...xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)];
  const out = [];
  for (const row of rows) {
    const cells = [...row[1].matchAll(/<c r="([A-Z]+)(\d+)"([^>]*)>([\s\S]*?)<\/c>/g)];
    const rowData = {};
    for (const c of cells) {
      const col = c[1];
      const type = /t="s"/.test(c[3]) ? "s" : "n";
      const vMatch = c[4].match(/<v>([^<]*)<\/v>/);
      const tMatch = c[4].match(/<t[^>]*>([^<]*)<\/t>/);
      let val = "";
      if (tMatch) val = tMatch[1];
      else if (vMatch) val = type === "s" ? shared[Number(vMatch[1])] ?? vMatch[1] : vMatch[1];
      rowData[col] = val;
    }
    if (rowData.A || rowData.B) out.push({ A: rowData.A, B: rowData.B });
  }
  return out;
}

const shared = readSharedStrings();
const rows = parseSheet("sheet3.xml", shared);
console.log(rows.slice(0, 40));

const metrics = {};
for (let i = 1; i < rows.length; i++) {
  const key = rows[i].A;
  const val = rows[i].B;
  if (key && val && !key.startsWith("extra")) metrics[key] = val;
}
console.log("\nmetrics:", metrics);
