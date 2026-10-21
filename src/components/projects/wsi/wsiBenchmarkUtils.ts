import type { BenchmarkRow } from "@/lib/wsiDashboard";

export function parseMetricHead(value: string): number | null {
  const m = value.match(/-?[\d.]+/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

/** 比較基準固定為 Mask-RCNN（不再取兩組 baseline 較高者）。 */
export function maskRcnnBaseline(row: BenchmarkRow): number | null {
  return parseMetricHead(row.maskRcnn);
}

/** @deprecated 改用 maskRcnnBaseline；保留別名以免舊引用炸掉 */
export function bestBaseline(row: BenchmarkRow): number | null {
  return maskRcnnBaseline(row);
}

export function leadingBaselineName(_row: BenchmarkRow): string {
  return "Mask-RCNN";
}

/** 以數值比較判定是否勝過 Mask-RCNN（不依賴 note 字串）。 */
export function oursWinsRow(row: BenchmarkRow): boolean {
  const ours = parseMetricHead(row.ours);
  const base = maskRcnnBaseline(row);
  if (ours == null || base == null) return false;
  return ours > base;
}

export function winMarginPct(ours: number, baseline: number): number | null {
  if (!baseline) return null;
  return ((ours - baseline) / baseline) * 100;
}

export function formatWinPct(pct: number | null): string {
  if (pct == null || !Number.isFinite(pct)) return "—";
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

export function summarizeBenchmarkWins(rows: BenchmarkRow[]) {
  const winCount = rows.filter(oursWinsRow).length;
  const winRate = rows.length ? (winCount / rows.length) * 100 : 0;
  const margins = rows
    .filter(oursWinsRow)
    .map((r) => {
      const ours = parseMetricHead(r.ours);
      const base = maskRcnnBaseline(r);
      if (ours == null || base == null) return null;
      return winMarginPct(ours, base);
    })
    .filter((v): v is number => v != null && Number.isFinite(v));
  const avgMargin = margins.length
    ? margins.reduce((a, b) => a + b, 0) / margins.length
    : null;
  return { winCount, total: rows.length, winRate, avgMargin };
}
