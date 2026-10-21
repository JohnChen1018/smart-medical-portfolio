import type { AiProviderId } from "@/lib/aiTokenUsage";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export const AI_PROVIDERS: AiProviderId[] = ["cursor", "openai", "gemini", "google-ai"];

export function providerConfig(provider: Exclude<AiProviderId, never>) {
  switch (provider) {
    case "cursor":
      return {
        key: process.env.CURSOR_API_KEY || "",
        model: process.env.CURSOR_MODEL || "composer-2.5",
      };
    case "openai":
      return {
        base: (process.env.OPENAI_BASE_URL || "https://api.openai.com").replace(/\/$/, ""),
        path: "/v1/chat/completions",
        key: process.env.OPENAI_API_KEY || "",
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      };
    case "gemini":
    case "google-ai":
      return {
        base: (process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com").replace(
          /\/$/,
          "",
        ),
        path: `/v1beta/models/${process.env.GEMINI_MODEL || "gemini-2.0-flash"}:generateContent`,
        key: process.env.GEMINI_API_KEY || "",
        model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
        googleSearch: provider === "google-ai",
      };
    default:
      return null;
  }
}

export async function probeOpenAI(key: string, base: string) {
  if (!key) return false;
  try {
    const res = await fetch(`${base}/v1/models`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(4000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function probeGemini(key: string, model: string) {
  if (!key) return false;
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function chatOpenAI(
  cfg: NonNullable<ReturnType<typeof providerConfig>>,
  messages: ChatMessage[],
) {
  if (!cfg.key) throw new Error("未設定 OPENAI_API_KEY");
  const res = await fetch(`${cfg.base}${cfg.path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.key}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages,
      temperature: 0.4,
    }),
    signal: AbortSignal.timeout(120_000),
  });
  const data = (await res.json()) as {
    error?: { message?: string };
    choices?: { message?: { content?: string } }[];
    usage?: { total_tokens?: number };
  };
  if (!res.ok) throw new Error(data.error?.message || `GPT 錯誤 HTTP ${res.status}`);
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("GPT 沒有回傳內容");
  return {
    content,
    usageTokens: data.usage?.total_tokens ?? 0,
    model: cfg.model,
  };
}

export async function chatGemini(
  cfg: NonNullable<ReturnType<typeof providerConfig>>,
  messages: ChatMessage[],
  googleSearch = false,
) {
  if (!cfg.key) throw new Error("未設定 GEMINI_API_KEY");
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
  const url = `${cfg.base}${cfg.path}?key=${encodeURIComponent(cfg.key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: system ? { parts: [{ text: system }] } : undefined,
      contents,
      ...(googleSearch ? { tools: [{ google_search: {} }] } : {}),
    }),
    signal: AbortSignal.timeout(120_000),
  });
  const data = (await res.json()) as {
    error?: { message?: string };
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    usageMetadata?: { totalTokenCount?: number };
    groundingMetadata?: {
      webSearchQueries?: string[];
      groundingChunks?: { web?: { title?: string; uri?: string } }[];
    };
  };
  if (!res.ok) throw new Error(data.error?.message || `Gemini 錯誤 HTTP ${res.status}`);
  let content = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
  if (!content) throw new Error("Gemini 沒有回傳內容");

  if (googleSearch && data.groundingMetadata?.groundingChunks?.length) {
    const sources = data.groundingMetadata.groundingChunks
      .map((c) => c.web)
      .filter(Boolean)
      .slice(0, 5)
      .map((w) => `• ${w!.title ?? w!.uri}: ${w!.uri}`)
      .join("\n");
    if (sources) content += `\n\n---\n參考來源（Google 搜尋）：\n${sources}`;
  }

  return {
    content,
    usageTokens: data.usageMetadata?.totalTokenCount ?? 0,
    model: cfg.model,
  };
}

export async function chatCursor(messages: ChatMessage[]) {
  const key = process.env.CURSOR_API_KEY;
  if (!key) throw new Error("未設定 CURSOR_API_KEY（cursor.com → Settings → API Keys）");

  const { Agent } = await import("@cursor/sdk");
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n");
  const turns = messages
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role === "user" ? "使用者" : "助手"}：${m.content}`)
    .join("\n\n");
  const prompt = [system, turns, "助手："].filter(Boolean).join("\n\n");

  const result = await Agent.prompt(prompt, {
    apiKey: key,
    model: { id: process.env.CURSOR_MODEL || "composer-2.5" },
    local: { cwd: process.cwd() },
  });

  if (result.status === "error") throw new Error("Cursor Agent 執行失敗");
  const content = result.result?.trim();
  if (!content) throw new Error("Cursor 沒有回傳內容");
  return {
    content,
    usageTokens: 0,
    model: process.env.CURSOR_MODEL || "composer-2.5",
  };
}
