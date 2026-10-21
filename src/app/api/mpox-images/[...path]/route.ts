import { mpoxDatasetRoot } from "@/lib/datasetPaths";
import { NextResponse } from "next/server";
import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { isInsideDir } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const segments = (await params).path;
  if (!segments || segments.length < 2) {
    return NextResponse.json({ error: "需要 category/filename" }, { status: 400 });
  }

  const [category, ...rest] = segments;
  const filename = rest.join("/");
  if (filename.includes("..")) {
    return NextResponse.json({ error: "非法路徑" }, { status: 400 });
  }

  const allowed = new Set(["Monkeypox_augmented", "Others_augmented"]);
  if (!allowed.has(category)) {
    return NextResponse.json({ error: "未知類別" }, { status: 400 });
  }

  const root = mpoxDatasetRoot();
  const filePath = path.resolve(root, category, filename);
  if (!isInsideDir(path.resolve(root, category), filePath) || !existsSync(filePath)) {
    return NextResponse.json({ error: "找不到影像" }, { status: 404 });
  }

  const stream = createReadStream(filePath);
  const webStream = Readable.toWeb(stream) as ReadableStream;
  const ext = path.extname(filename).toLowerCase();
  const contentType = ext === ".png" ? "image/png" : "image/jpeg";

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
