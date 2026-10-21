import { promises as fs } from "node:fs";
import path from "node:path";

export type AiProviderId = "cursor" | "openai" | "gemini" | "google-ai";

export type ProviderUsage = {
  provider: AiProviderId;
  label: string;
  usedTokens: number;
  requestCount: number;
  dailyLimit: number;
  remaining: number;
  percentUsed: number;
  limited: boolean;
  updatedAt: string | null;
};

type UsageFile = {
  days: Record<
    string,
    Record<
      string,
      {
        usedTokens: number;
        requestCount: number;
        updatedAt: string;
      }
    >
  >;
};

const USAGE_PATH = path.join(process.cwd(), "data", "ai_usage.json");

const PROVIDERS: AiProviderId[] = ["cursor", "openai", "gemini", "google-ai"];

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function dailyLimitFor(provider: AiProviderId): number {
  const envMap: Record<AiProviderId, string | undefined> = {
    cursor: process.env.AI_DAILY_TOKEN_LIMIT_CURSOR,
    openai: process.env.AI_DAILY_TOKEN_LIMIT_OPENAI,
    gemini: process.env.AI_DAILY_TOKEN_LIMIT_GEMINI,
    "google-ai": process.env.AI_DAILY_TOKEN_LIMIT_GOOGLE_AI,
  };
  const defaults: Record<AiProviderId, number> = {
    cursor: 500_000,
    openai: 200_000,
    gemini: 250_000,
    "google-ai": 250_000,
  };
  const raw = envMap[provider];
  const n = raw ? Number(raw) : defaults[provider];
  return Number.isFinite(n) && n > 0 ? n : defaults[provider];
}

export const LABELS: Record<AiProviderId, string> = {
  cursor: "Cursor",
  openai: "GPT",
  gemini: "Gemini",
  "google-ai": "Google AI（搜尋）",
};

async function readUsage(): Promise<UsageFile> {
  try {
    const raw = await fs.readFile(USAGE_PATH, "utf8");
    return JSON.parse(raw) as UsageFile;
  } catch {
    return { days: {} };
  }
}

async function writeUsage(data: UsageFile) {
  await fs.mkdir(path.dirname(USAGE_PATH), { recursive: true });
  await fs.writeFile(USAGE_PATH, JSON.stringify(data, null, 2), "utf8");
}

function estimateTokens(text: string) {
  const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const other = Math.max(0, text.length - cjk);
  return Math.max(1, Math.ceil(cjk * 1.2 + other / 4));
}

export function estimateChatTokens(messages: { content: string }[], reply = "") {
  const prompt = messages.reduce((s, m) => s + estimateTokens(m.content), 0);
  const completion = estimateTokens(reply);
  return { prompt, completion, total: prompt + completion };
}

export async function getProviderUsage(provider: AiProviderId, day = todayKey()): Promise<ProviderUsage> {
  const data = await readUsage();
  const entry = data.days[day]?.[provider];
  const used = entry?.usedTokens ?? 0;
  const limit = dailyLimitFor(provider);
  const percentUsed = Math.min(100, (used / limit) * 100);
  return {
    provider,
    label: LABELS[provider],
    usedTokens: used,
    requestCount: entry?.requestCount ?? 0,
    dailyLimit: limit,
    remaining: Math.max(0, limit - used),
    percentUsed,
    limited: percentUsed >= 70,
    updatedAt: entry?.updatedAt ?? null,
  };
}

export async function getAllProviderUsage(day = todayKey()) {
  const list = await Promise.all(PROVIDERS.map((p) => getProviderUsage(p, day)));
  return { day, providers: list };
}

export async function assertWithinQuota(provider: AiProviderId) {
  const usage = await getProviderUsage(provider);
  if (usage.limited) {
    const err = new Error("已達到當日限制");
    (err as Error & { code?: string; usage?: ProviderUsage }).code = "DAILY_LIMIT";
    (err as Error & { usage?: ProviderUsage }).usage = usage;
    throw err;
  }
  return usage;
}

export async function recordTokenUsage(
  provider: AiProviderId,
  tokens: number,
  day = todayKey(),
) {
  const data = await readUsage();
  if (!data.days[day]) data.days[day] = {};
  const prev = data.days[day][provider] ?? { usedTokens: 0, requestCount: 0, updatedAt: day };
  const add = tokens > 0 ? tokens : estimateTokens("x".repeat(200));
  data.days[day][provider] = {
    usedTokens: prev.usedTokens + Math.max(0, Math.floor(add)),
    requestCount: prev.requestCount + 1,
    updatedAt: new Date().toISOString(),
  };
  await writeUsage(data);
  return getProviderUsage(provider, day);
}

export async function getUsageHistory(days = 14) {
  const out: { day: string; providers: ProviderUsage[] }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = todayKey(d);
    out.push({
      day: key,
      providers: await Promise.all(PROVIDERS.map((p) => getProviderUsage(p, key))),
    });
  }
  return out;
}
