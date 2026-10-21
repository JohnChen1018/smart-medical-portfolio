import { NextRequest, NextResponse } from "next/server";
import { benchmark } from "@/lib/wsiDashboard";
import {
  AI_PROVIDERS,
  chatCursor,
  chatGemini,
  chatOpenAI,
  probeGemini,
  probeOpenAI,
  providerConfig,
  type ChatMessage,
} from "@/lib/aiProviders";
import {
  assertWithinQuota,
  estimateChatTokens,
  getAllProviderUsage,
  LABELS,
  recordTokenUsage,
  type AiProviderId,
} from "@/lib/aiTokenUsage";
import { summarizeBenchmarkWins } from "@/components/projects/wsi/wsiBenchmarkUtils";
import { allowRequest, clientAddress, tooManyResponse } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const { winCount, total } = summarizeBenchmarkWins(benchmark.rows);

const SYSTEM_PROMPT = `你是全切片影像（WSI）細胞核分割實驗的研究助手。研究員使用 StarDist + AdamW（TensorFlow/Keras）。

論文對比基準固定為 Mask-RCNN（Nunes et al. 2024 colon overall）：
- multi mPQ+ 本研究 ${benchmark.rows[0]?.ours} vs Mask-RCNN ${benchmark.rows[0]?.maskRcnn}
- 勝過 Mask-RCNN：${winCount}/${total} 項
- 參數量約 ${benchmark.oursParamsLabel}（vs Mask-RCNN 44M）
- 最佳配置：實驗序號 49（Exp451 / LeakyReLU）
請用繁體中文簡潔回答。`;

/** 選定 → GPT → Cursor → Gemini/Google AI */
const FALLBACK_ORDER: AiProviderId[] = ["openai", "cursor", "gemini", "google-ai"];

function providerHints(id: AiProviderId, ready: boolean) {
  switch (id) {
    case "cursor":
      return ready
        ? `已設定 CURSOR_API_KEY · ${process.env.CURSOR_MODEL || "composer-2.5"}`
        : "請在 .env 設定 CURSOR_API_KEY（cursor.com → Settings → API Keys）";
    case "openai":
      return ready
        ? `已設定 OPENAI_API_KEY · ${process.env.OPENAI_MODEL || "gpt-4o-mini"}`
        : "請在 .env 設定 OPENAI_API_KEY";
    case "gemini":
      return ready
        ? `已設定 GEMINI_API_KEY · ${process.env.GEMINI_MODEL || "gemini-2.0-flash"}（探測成功≠生成額度）`
        : "請在 .env 設定 GEMINI_API_KEY（aistudio.google.com）";
    case "google-ai":
      return ready
        ? "Gemini + Google 搜尋 grounding（需 GEMINI_API_KEY；探測成功≠生成額度）"
        : "需 GEMINI_API_KEY；啟用後可即時搜尋網路並附來源";
    default:
      return "";
  }
}

function isQuotaError(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes("quota") ||
    m.includes("rate") ||
    m.includes("429") ||
    m.includes("resource_exhausted") ||
    m.includes("limit: 0") ||
    m.includes("exceeded") ||
    m.includes("已達到當日限制")
  );
}

function localRuleSuggestion(userText: string): string {
  const q = userText.toLowerCase();
  const lines = [
    "【本地規則建議】雲端 AI 皆不可用，以下依現有 benchmark 數字整理：",
    "",
    `• 最佳配置：實驗 49（Exp451 / LeakyReLU），mPQ+ ${benchmark.rows[0]?.ours ?? "0.4720"}`,
    `• 相對 Mask-RCNN：勝過 ${winCount}/${total} 項；參數量約 ${benchmark.oursParamsLabel} vs 44M`,
    `• 對照配置：實驗 50（Exp450），mPQ+ 約 0.4572（低於 49）`,
  ];
  if (q.includes("增強") || q.includes("aug")) {
    lines.push("• 本研究未做資料增強仍領先 Mask-RCNN，代表架構／超參數本身貢獻大。");
  }
  if (q.includes("參數") || q.includes("輕量") || q.includes("小")) {
    lines.push("• 輕量仍高分：StarDist 星形表示比 Mask-RCNN 的像素 mask 頭更省參數。");
  }
  lines.push("", "建議：至 /admin/tokens 確認 GPT 或 Cursor 金鑰，並注意 Gemini 免費額度可能為 0。");
  return lines.join("\n");
}

async function callProvider(provider: AiProviderId, messages: ChatMessage[]) {
  if (provider === "cursor") {
    const result = await chatCursor(messages);
    return {
      content: result.content,
      usageTokens: result.usageTokens || estimateChatTokens(messages, result.content).total,
      model: result.model,
    };
  }
  if (provider === "openai") {
    const cfg = providerConfig("openai")!;
    const result = await chatOpenAI(cfg, messages);
    return {
      content: result.content,
      usageTokens: result.usageTokens || estimateChatTokens(messages, result.content).total,
      model: result.model,
    };
  }
  if (provider === "gemini" || provider === "google-ai") {
    const cfg = providerConfig(provider)!;
    const result = await chatGemini(cfg, messages, provider === "google-ai");
    return {
      content: result.content,
      usageTokens: result.usageTokens || estimateChatTokens(messages, result.content).total,
      model: result.model,
    };
  }
  throw new Error("未知 provider");
}

export async function GET() {
  const usage = await getAllProviderUsage();
  const openaiCfg = providerConfig("openai")!;
  const geminiModel = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const geminiKey = process.env.GEMINI_API_KEY || "";

  const [openaiUp, geminiUp, cursorReady] = await Promise.all([
    probeOpenAI(openaiCfg.key, openaiCfg.base!),
    probeGemini(geminiKey, geminiModel),
    Promise.resolve(Boolean(process.env.CURSOR_API_KEY)),
  ]);

  const providers = AI_PROVIDERS.map((id) => {
    const ready =
      id === "cursor"
        ? cursorReady
        : id === "openai"
          ? openaiUp
          : id === "gemini" || id === "google-ai"
            ? geminiUp
            : false;
    return {
      id,
      label: LABELS[id],
      ready,
      hint: providerHints(id, ready),
      usage: usage.providers.find((p) => p.provider === id),
    };
  });

  return NextResponse.json({ ok: true, day: usage.day, providers });
}

export async function POST(req: NextRequest) {
  if (!allowRequest(`ai:${clientAddress(req)}`, 30, 60 * 60 * 1000)) {
    return tooManyResponse();
  }
  try {
    const body = (await req.json()) as {
      provider?: AiProviderId;
      messages?: ChatMessage[];
      allowFallback?: boolean;
    };
    const preferred = body.provider || "gemini";
    const allowFallback = body.allowFallback !== false;
    const rawMessages = body.messages?.length ? body.messages : [{ role: "system" as const, content: SYSTEM_PROMPT }];
    const messages: ChatMessage[] = rawMessages.slice(0, 20).map((m) => ({
      role: m.role as ChatMessage["role"],
      content: String(m.content || "").slice(0, 4000),
    }));

    if (!messages.some((m) => m.role === "system")) {
      messages.unshift({ role: "system", content: SYSTEM_PROMPT });
    }

    const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

    const chain: AiProviderId[] = allowFallback
      ? [preferred, ...FALLBACK_ORDER.filter((p) => p !== preferred)]
      : [preferred];

    const errors: string[] = [];
    let usedProvider: AiProviderId | null = null;
    let content = "";
    let usageTokens = 0;
    let modelName = "";
    let fallbackFrom: AiProviderId | undefined;

    for (const provider of chain) {
      try {
        await assertWithinQuota(provider);
      } catch (err) {
        const usage = (err as { usage?: unknown }).usage;
        if (!allowFallback || provider === chain[chain.length - 1]) {
          if (allowFallback) {
            return NextResponse.json({
              ok: true,
              content: localRuleSuggestion(lastUser),
              provider: "local",
              model: "local-rules",
              fallbackFrom: preferred,
              local: true,
              usage,
            });
          }
          return NextResponse.json(
            { ok: false, error: "已達到當日限制", code: "DAILY_LIMIT", usage },
            { status: 429 },
          );
        }
        errors.push(`${LABELS[provider]}：當日限制`);
        continue;
      }

      try {
        const result = await callProvider(provider, messages);
        usedProvider = provider;
        content = result.content;
        usageTokens = result.usageTokens;
        modelName = result.model;
        if (provider !== preferred) fallbackFrom = preferred;
        break;
      } catch (err) {
        const message = err instanceof Error ? err.message : "連線失敗";
        errors.push(`${LABELS[provider]}：${message}`);
        if (!allowFallback) {
          return NextResponse.json(
            {
              ok: false,
              error: isQuotaError(message)
                ? `上游配額不足：${message}`
                : message,
              code: isQuotaError(message) ? "UPSTREAM_QUOTA" : "PROVIDER_ERROR",
            },
            { status: 502 },
          );
        }
      }
    }

    if (!usedProvider || !content) {
      return NextResponse.json({
        ok: true,
        content: `${localRuleSuggestion(lastUser)}\n\n（嘗試失敗：${errors.join("；")}）`,
        provider: "local",
        model: "local-rules",
        fallbackFrom: preferred,
        local: true,
        errors,
      });
    }

    const usage = await recordTokenUsage(usedProvider, usageTokens);
    return NextResponse.json({
      ok: true,
      content,
      provider: usedProvider,
      model: modelName,
      fallbackFrom,
      usage,
      limited: usage.limited,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI 連線失敗";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
