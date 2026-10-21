import type { ConfusionMatrix } from "./wsiResults";

function parseCsvLine(line: string) {
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

export function parseConfusionCsv(csv: string): ConfusionMatrix {
  const lines = csv.trim().split(/\r?\n/);
  const header = parseCsvLine(lines[0]).slice(1);
  const rows: ConfusionMatrix["rows"] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    rows.push({ label: cols[0], values: cols.slice(1).map(Number) });
  }
  return { labels: header, rows };
}
