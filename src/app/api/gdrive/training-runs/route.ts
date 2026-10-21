import { NextResponse } from "next/server";
import { listTrainingRunNames } from "@/lib/googleDrive";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const folderId = new URL(request.url).searchParams.get("folderId");
  if (!folderId) {
    return NextResponse.json({ ok: false, error: "缺少 folderId" }, { status: 400 });
  }

  try {
    const runs = await listTrainingRunNames(folderId);
    return NextResponse.json({ ok: true, runs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "讀取 run 清單失敗";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
