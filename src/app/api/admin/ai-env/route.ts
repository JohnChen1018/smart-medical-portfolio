import { NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal-auth";
import { patchAiEnvKeys } from "@/lib/patchEnvFile";
import { probeGemini, probeOpenAI } from "@/lib/aiProviders";

export const dynamic = "force-dynamic";

type Body = {
  cursorApiKey?: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
};

export async function POST(req: Request) {
  const session = await getPortalSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ ok: false, error: "未授權" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "無效的 JSON" }, { status: 400 });
  }

  const updates: Parameters<typeof patchAiEnvKeys>[0] = {};
  if (body.cursorApiKey?.trim()) updates.CURSOR_API_KEY = body.cursorApiKey.trim();
  if (body.openaiApiKey?.trim()) updates.OPENAI_API_KEY = body.openaiApiKey.trim();
  if (body.geminiApiKey?.trim()) updates.GEMINI_API_KEY = body.geminiApiKey.trim();

  if (!Object.keys(updates).length) {
    return NextResponse.json({ ok: false, error: "請至少填寫一組金鑰" }, { status: 400 });
  }

  patchAiEnvKeys(updates);

  const openaiKey = process.env.OPENAI_API_KEY || "";
  const geminiKey = process.env.GEMINI_API_KEY || "";
  const cursorKey = process.env.CURSOR_API_KEY || "";
  const openaiBase = (process.env.OPENAI_BASE_URL || "https://api.openai.com").replace(/\/$/, "");

  const [openaiUp, geminiUp] = await Promise.all([
    openaiKey ? probeOpenAI(openaiKey, openaiBase) : Promise.resolve(false),
    geminiKey
      ? probeGemini(geminiKey, process.env.GEMINI_MODEL || "gemini-2.0-flash")
      : Promise.resolve(false),
  ]);

  return NextResponse.json({
    ok: true,
    saved: Object.keys(updates),
    probe: {
      cursor: Boolean(cursorKey),
      openai: openaiUp,
      gemini: geminiUp,
    },
    restartRequired: true,
    message: "金鑰已永久寫入 .env。執行 npm run wsi 重啟後會自動載入，之後不用再貼。",
  });
}
