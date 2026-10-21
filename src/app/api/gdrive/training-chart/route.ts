import { NextResponse } from "next/server";
import { downloadDriveBinary, findTrainingCurveFile } from "@/lib/googleDrive";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const folderId = url.searchParams.get("folderId");
  const run = url.searchParams.get("run") ?? undefined;

  if (!folderId) {
    return NextResponse.json({ ok: false, error: "缺少 folderId 參數" }, { status: 400 });
  }

  try {
    const found = await findTrainingCurveFile(folderId, run);
    if (!found) {
      return NextResponse.json(
        { ok: false, error: run ? `找不到 ${run} 的 training_curve.png` : "找不到 training_curve.png" },
        { status: 404 },
      );
    }

    const { data, contentType } = await downloadDriveBinary(found.fileId);
    const type = contentType.startsWith("image/") ? contentType : "image/png";

    return new NextResponse(data, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Training-Run": found.run,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "讀取訓練曲線圖失敗";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
