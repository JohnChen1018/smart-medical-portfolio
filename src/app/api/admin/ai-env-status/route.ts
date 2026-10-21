import { NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal-auth";
import { probeGemini, probeOpenAI } from "@/lib/aiProviders";
import { listPersistedAiKeys } from "@/lib/patchEnvFile";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getPortalSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ ok: false, error: "未授權" }, { status: 401 });
  }

  const openaiKey = Boolean(process.env.OPENAI_API_KEY);
  const geminiKey = Boolean(process.env.GEMINI_API_KEY);
  const cursorKey = Boolean(process.env.CURSOR_API_KEY);
  const openaiBase = (process.env.OPENAI_BASE_URL || "https://api.openai.com").replace(/\/$/, "");

  const [openaiUp, geminiUp] = await Promise.all([
    openaiKey ? probeOpenAI(process.env.OPENAI_API_KEY!, openaiBase) : Promise.resolve(false),
    geminiKey
      ? probeGemini(process.env.GEMINI_API_KEY!, process.env.GEMINI_MODEL || "gemini-2.0-flash")
      : Promise.resolve(false),
  ]);

  const persisted = listPersistedAiKeys();

  return NextResponse.json({
    ok: true,
    persisted,
    persistNote: "金鑰寫入專案 .env 後永久保存；每次 npm run wsi 或 next start 會自動載入，不需重貼。",
    providers: [
      {
        id: "cursor",
        label: "Cursor",
        envSet: cursorKey,
        persisted: persisted.CURSOR_API_KEY,
        connected: cursorKey,
        hint: cursorKey ? "CURSOR_API_KEY 已設定（.env 永久）" : "請在 .env 或後台設定 CURSOR_API_KEY",
      },
      {
        id: "openai",
        label: "GPT",
        envSet: openaiKey,
        persisted: persisted.OPENAI_API_KEY,
        connected: openaiUp,
        hint: openaiKey
          ? openaiUp
            ? "OpenAI API 連線成功（.env 永久）"
            : "金鑰已設但連線失敗，請檢查 OpenAI 額度"
          : "請在 .env 或後台設定 OPENAI_API_KEY",
      },
      {
        id: "gemini",
        label: "Gemini",
        envSet: geminiKey,
        persisted: persisted.GEMINI_API_KEY,
        connected: geminiUp,
        hint: geminiKey
          ? geminiUp
            ? "Gemini API 連線成功（.env 永久）"
            : "金鑰已設但連線失敗，請至 aistudio.google.com 確認額度"
          : "請在 .env 或後台設定 GEMINI_API_KEY",
      },
      {
        id: "google-ai",
        label: "Google AI（搜尋）",
        envSet: geminiKey,
        persisted: persisted.GEMINI_API_KEY,
        connected: geminiUp,
        hint: "與 Gemini 共用 GEMINI_API_KEY（.env 永久）",
      },
    ],
    envPath: ".env（專案根目錄，修改後執行 npm run wsi 即可）",
  });
}
