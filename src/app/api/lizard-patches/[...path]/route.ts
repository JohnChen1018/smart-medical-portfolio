import { lizardPatchImagesRoot } from "@/lib/datasetPaths";
import { NextResponse } from "next/server";
import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const segments = (await params).path;
  if (!segments?.length) {
    return NextResponse.json({ error: "需要檔名" }, { status: 400 });
  }

  const filename = segments.join("/");
  if (filename.includes("..") || !/^conic_\d{6}\.png$/i.test(filename)) {
    return NextResponse.json({ error: "非法路徑" }, { status: 400 });
  }

  const filePath = path.join(lizardPatchImagesRoot(), filename);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "找不到影像" }, { status: 404 });
  }

  const stream = createReadStream(filePath);
  const webStream = Readable.toWeb(stream) as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
