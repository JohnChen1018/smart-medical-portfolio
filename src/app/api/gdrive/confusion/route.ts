import { NextResponse } from "next/server";
import { downloadDriveText, findConfusionMatrixFileId } from "@/lib/googleDrive";
import { parseConfusionCsv } from "@/lib/wsiConfusion";

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
    const fileId = await findConfusionMatrixFileId(folderId, run);
    if (!fileId) {
      return NextResponse.json({ ok: false, error: "找不到 confusion_matrix_normalized.csv" }, { status: 404 });
    }

    const csv = await downloadDriveText(fileId);
    const confusion = parseConfusionCsv(csv);

    return NextResponse.json({ ok: true, confusion, fileId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "讀取混淆矩陣失敗";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
