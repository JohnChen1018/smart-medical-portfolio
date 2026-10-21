import { NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

const INDEX_PATH = path.join(process.cwd(), "data", "mpox_images_index.json");

type MpoxIndex = {
  total: number;
  images: { file: string; label: string; category: string }[];
};

let cached: { mtimeMs: number; data: MpoxIndex } | null = null;

async function loadIndex(): Promise<MpoxIndex> {
  const st = await stat(INDEX_PATH);
  if (cached && cached.mtimeMs === st.mtimeMs) return cached.data;
  const raw = await readFile(INDEX_PATH, "utf8");
  const data = JSON.parse(raw) as MpoxIndex;
  cached = { mtimeMs: st.mtimeMs, data };
  return data;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));
  const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") ?? 80)));
  const label = searchParams.get("label") ?? "all";

  try {
    const data = await loadIndex();

    let images = data.images;
    if (label === "Monkeypox") images = images.filter((i) => i.label === "Monkeypox");
    if (label === "Others") images = images.filter((i) => i.label === "Others");

    const slice = images.slice(offset, offset + limit);
    return NextResponse.json({
      total: images.length,
      offset,
      limit,
      images: slice,
    });
  } catch {
    return NextResponse.json({ total: 0, offset, limit, images: [], error: "影像索引尚未建立" }, { status: 500 });
  }
}
