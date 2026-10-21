import { NextRequest, NextResponse } from "next/server";
import { getCached, setCached } from "@/lib/apiCache";
import { searchDataCite, searchEuropePmc } from "@/lib/research/openData";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim().slice(0, 300);
  const kind = searchParams.get("kind") || "all";
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);

  if (!q) {
    return NextResponse.json({ ok: false, error: "請輸入關鍵字" }, { status: 400 });
  }

  const cacheKey = `research:${kind}:${page}:${q.toLowerCase()}`;
  const cached = getCached<{ papers: unknown[]; datasets: unknown[] }>(cacheKey, 60_000);
  if (cached) {
    return NextResponse.json({ ok: true, query: q, page, ...cached, cached: true });
  }

  try {
    const wantPapers = kind === "all" || kind === "paper";
    const wantDatasets = kind === "all" || kind === "dataset";
    const [papers, datasets] = await Promise.all([
      wantPapers ? searchEuropePmc(q, page) : Promise.resolve([]),
      wantDatasets ? searchDataCite(q, page) : Promise.resolve([]),
    ]);
    const payload = { papers, datasets };
    setCached(cacheKey, payload);
    return NextResponse.json({ ok: true, query: q, page, ...payload, cached: false });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "搜尋失敗" },
      { status: 502 },
    );
  }
}
