import fs from "node:fs";

const csv = fs.readFileSync(
  "D:\\lizard conic\\CoNIC_Patches_256_NoOverlap_Official\\counts.csv",
  "utf8",
);
const lines = csv.trim().split(/\r?\n/);
const header = lines[0].split(",");
const totals = new Array(header.length).fill(0);
let rows = 0;
for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(",");
  if (parts.length !== header.length) continue;
  rows++;
  for (let c = 0; c < header.length; c++) {
    totals[c] += Number(parts[c]) || 0;
  }
}
const grand = totals.reduce((a, b) => a + b, 0);
console.log("patches:", rows);
header.forEach((h, i) => {
  console.log(
    `${h}: ${totals[i].toLocaleString()} (${((totals[i] / grand) * 100).toFixed(2)}%)`,
  );
});
console.log("TOTAL nuclei:", grand.toLocaleString());
