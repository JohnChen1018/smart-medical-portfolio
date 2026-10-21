import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const dir = path.dirname(fileURLToPath(import.meta.url));
const xlsx = path.join(dir, "_tmp_results.xlsx");
const outDir = path.join(dir, "_tmp_xlsx");
fs.mkdirSync(outDir, { recursive: true });
execSync(`powershell -Command "Copy-Item '${xlsx}' '${path.join(dir, "_tmp.zip")}'; Expand-Archive -Path '${path.join(dir, "_tmp.zip")}' -DestinationPath '${outDir}' -Force"`, { stdio: "inherit" });

for (const sheet of ["sheet1.xml", "sheet2.xml", "sheet3.xml"]) {
  const p = path.join(outDir, "xl", "worksheets", sheet);
  if (!fs.existsSync(p)) continue;
  const xml = fs.readFileSync(p, "utf8");
  const texts = [...xml.matchAll(/<t[^>]*>([^<]+)<\/t>/g)].map((m) => m[1]);
  console.log(`\n=== ${sheet} ===`);
  console.log(texts.join(" | "));
}
