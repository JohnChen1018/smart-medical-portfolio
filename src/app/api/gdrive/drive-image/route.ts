import { NextResponse } from "next/server";
import { downloadDriveBinary, findDriveImageByName } from "@/lib/googleDrive";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** 從指定 Drive 資料夾讀取單一圖檔（例如 exp451 三面板總覽圖） */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const rootFolderId = url.searchParams.get("rootFolderId");
  const fileName = url.searchParams.get("fileName");

  if (!rootFolderId || !fileName) {
    return NextResponse.json({ ok: false, error: "缺少 rootFolderId 或 fileName" }, { status: 400 });
  }

  try {
    const fileId = await findDriveImageByName(rootFolderId, fileName);
    if (!fileId) {
      return NextResponse.json({ ok: false, error: `找不到 ${fileName}` }, { status: 404 });
    }

    const { data, contentType } = await downloadDriveBinary(fileId);
    const type = contentType.startsWith("image/") ? contentType : "image/png";

    return new NextResponse(data, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "讀取圖片失敗";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
