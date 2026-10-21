import { NextResponse } from "next/server";
import { chatGemini, chatOpenAI, providerConfig, type ChatMessage } from "@/lib/aiProviders";
import { cleanSearchKeyword, customTopicId, type SourcedKeyword } from "@/lib/research/surveySearchTopics";
import { allowRequest, isDirectLocalRequest, localOnlyResponse, tooManyResponse } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function parseKeywords(content: string): SourcedKeyword[] {
  const jsonText = content.split("\n---")[0] ?? content;
  const match = jsonText.match(/\{[\s\S]*\}/);
  if (!match) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return [];
  }
  const record = asRecord(parsed);
  const rows = Array.isArray(record?.keywords) ? record.keywords : [];
  const keywords: SourcedKeyword[] = [];
  for (const row of rows) {
    const item = asRecord(row);
    const keyword = cleanSearchKeyword(typeof item?.keyword === "string" ? item.keyword : "");
    const source = typeof item?.source === "string" ? item.source.replace(/\s+/g, " ").trim().slice(0, 180) : "";
    const url = typeof item?.url === "string" && /^https?:\/\//i.test(item.url.trim()) ? item.url.trim() : "";
    if (!keyword || !source) continue;
    if (keywords.some((current) => current.keyword.toLowerCase() === keyword.toLowerCase())) continue;
    keywords.push(url ? { keyword, source, url } : { keyword, source });
    if (keywords.length >= 12) break;
  }
  return keywords;
}

async function askModel(topic: string) {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "你幫研究者找 survey paper 的標題檢索詞。只回 JSON，不要其他文字。沒有把握的網址留空字串，不要編造 DOI 或論文。",
    },
    {
      role: "user",
      content: `主題：${topic}
請依這個主題搜尋論文標題常用的檢索詞，回傳：
{"keywords":[{"keyword":"檢索詞","source":"出處名稱","url":"https://..."}]}
6 到 12 個。keyword 用論文標題會出現的詞，不要逗號。source 寫你看到的論文或網頁名稱。`,
    },
  ];
  const attempts: Array<() => Promise<{ content: string }>> = [];
  const openai = providerConfig("openai");
  if (openai?.key) attempts.push(() => chatOpenAI(openai, messages));
  const gemini = providerConfig("gemini");
  if (gemini?.key) {
    const live = {
      ...gemini,
      model: "gemini-3.5-flash-lite",
      path: "/v1beta/models/gemini-3.5-flash-lite:generateContent",
    };
    attempts.push(() => chatGemini(live, messages, true));
    attempts.push(() => chatGemini(live, messages, false));
  }
  if (attempts.length === 0) throw new Error("請在 .env 設定 OPENAI_API_KEY 或 GEMINI_API_KEY");
  let lastError: Error | null = null;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("關鍵字沒有找出來");
    }
  }
  throw lastError ?? new Error("關鍵字沒有找出來");
}

export async function POST(request: Request) {
  if (!isDirectLocalRequest(request)) return localOnlyResponse();
  if (!allowRequest("topic-keywords:local", 8, 10 * 60 * 1000)) return tooManyResponse();
  const body = (await request.json().catch(() => ({}))) as { topic?: string };
  const topic = cleanSearchKeyword(typeof body.topic === "string" ? body.topic : "");
  if (!topic) return NextResponse.json({ ok: false, error: "請先輸入主題" }, { status: 400 });
  try {
    const result = await askModel(topic);
    const keywords = parseKeywords(result.content);
    if (keywords.length === 0) {
      return NextResponse.json({ ok: false, error: "這次沒有找出關鍵字" }, { status: 502 });
    }
    return NextResponse.json({
      ok: true,
      plan: {
        id: customTopicId(topic),
        topicId: customTopicId(topic),
        title: topic,
        keywords,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "關鍵字沒有找出來";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
