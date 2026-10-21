"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FaKey, FaPaperPlane, FaRobot } from "react-icons/fa";
import { benchmark } from "@/lib/wsiDashboard";
import { fmtMetric, wsiUi } from "@/lib/wsiUiLabels";
import type { WsiConfig } from "@/lib/wsiResults";
import { summarizeBenchmarkWins } from "@/components/projects/wsi/wsiBenchmarkUtils";

type Provider = "cursor" | "openai" | "gemini" | "google-ai";
type UiMessage = { role: "user" | "assistant"; content: string };

type ProviderMeta = {
  id: Provider;
  label: string;
  ready: boolean;
  hint: string;
  usage?: {
    usedTokens: number;
    dailyLimit: number;
    percentUsed: number;
    limited: boolean;
    remaining: number;
  };
};

const QUICK_PROMPTS = [
  "用三句話總結本研究相對 Mask-RCNN 的優勢",
  "為什麼參數量小還能 mPQ+ 更高？",
  "沒做資料增強還能贏，代表什麼？",
];

function buildSystemPrompt(effectiveBest?: WsiConfig) {
  const { winCount, total } = summarizeBenchmarkWins(benchmark.rows);
  const exp = effectiveBest
    ? `exp_${String(effectiveBest.expId).padStart(2, "0")}`
    : `exp_${String(benchmark.oursExpId).padStart(2, "0")}`;
  const mPQ = effectiveBest?.mPQ ?? parseFloat(benchmark.rows[0]?.ours ?? "0");
  return `你是全切片影像（WSI）細胞核分割實驗的研究助手。研究員使用 StarDist + AdamW（TensorFlow/Keras）。

目前最佳配置：${exp}（對應雲端 Exp451 / LeakyReLU）
- multi mPQ+ ${fmtMetric(mPQ)}
- 勝過 Mask-RCNN：${winCount}/${total} 項
- 參數量約 ${benchmark.oursParamsLabel}（vs Mask-RCNN 44M）
- Mask PQ ${effectiveBest ? fmtMetric(effectiveBest.maskPQ) : "—"}、Precision ${effectiveBest ? fmtMetric(effectiveBest.precision) : "—"}、Recall ${effectiveBest ? fmtMetric(effectiveBest.recall) : "—"}

比較基準固定為 Mask-RCNN（Nunes et al. 2024）；HoVer-Net 僅參考。
請用繁體中文，簡潔、具體，可引用上述數字。`;
}

const FALLBACK: ProviderMeta[] = [
  { id: "gemini", label: "Gemini", ready: false, hint: "偵測連線中…" },
  { id: "openai", label: "GPT", ready: false, hint: "偵測連線中…" },
  { id: "cursor", label: "Cursor", ready: false, hint: "偵測連線中…" },
  { id: "google-ai", label: "Google AI", ready: false, hint: "偵測連線中…" },
];

export function AiChatPanel({
  effectiveBest,
  compact,
}: {
  effectiveBest?: WsiConfig;
  compact?: boolean;
}) {
  const [providers, setProviders] = useState<ProviderMeta[]>(FALLBACK);
  const [provider, setProvider] = useState<Provider>("gemini");
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const readyCount = providers.filter((p) => p.ready && !p.usage?.limited).length;

  const refreshProviders = () => {
    fetch("/api/ai/chat")
      .then((r) => r.json())
      .then((data: { providers?: ProviderMeta[] }) => {
        if (!data.providers?.length) return;
        setProviders(data.providers);
        setProvider((prev) => {
          const still = data.providers!.find((p) => p.id === prev);
          if (still?.ready && !still.usage?.limited) return prev;
          const first = data.providers!.find((p) => p.ready && !p.usage?.limited);
          return (first?.id as Provider) || prev;
        });
      })
      .catch(() => {});
  };

  useEffect(() => {
    refreshProviders();
    const t = setInterval(refreshProviders, 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const current = providers.find((p) => p.id === provider);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const anyReady = providers.some((p) => p.ready && !p.usage?.limited);
    if (!current?.ready && !anyReady) {
      setError(current?.hint || "請先設定 API 金鑰（仍可送出以取得本地規則建議）");
    }
    if (current?.usage?.limited && !anyReady) {
      setError("已達到當日限制");
      return;
    }
    setInput("");
    setError(null);
    const nextMessages: UiMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setBusy(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          allowFallback: true,
          messages: [
            { role: "system", content: buildSystemPrompt(effectiveBest) },
            ...nextMessages.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        content?: string;
        error?: string;
        code?: string;
        provider?: string;
        fallbackFrom?: string;
        local?: boolean;
      };
      if (!res.ok || !data.ok || !data.content) throw new Error(data.error || wsiUi.analysis.aiSuggestError);

      let reply = data.content;
      if (data.local) {
        reply = `（雲端模型皆不可用，已改用本地規則建議）\n\n${reply}`;
      } else if (data.fallbackFrom && data.provider && data.provider !== data.fallbackFrom) {
        const labels: Record<string, string> = {
          gemini: "Gemini",
          openai: "GPT",
          cursor: "Cursor",
          "google-ai": "Google AI",
        };
        reply = `（${labels[data.fallbackFrom] || data.fallbackFrom} 不可用，已改用 ${labels[data.provider] || data.provider}）\n\n${reply}`;
        if (data.provider === "openai" || data.provider === "cursor" || data.provider === "gemini" || data.provider === "google-ai") {
          setProvider(data.provider);
        }
      }

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      refreshProviders();
    } catch (err) {
      const msg = err instanceof Error ? err.message : wsiUi.analysis.aiSuggestError;
      setError(msg);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            msg === "已達到當日限制"
              ? "今日 token 已達上限。系統會自動改試其他模型；若皆失敗會改用本地規則建議。"
              : `${msg}\n\n請至後台設定金鑰：/admin/tokens`,
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-b from-[#1a1033]/90 to-[#0F172A] ${
        compact ? "h-full min-h-[480px]" : "h-[min(72vh,640px)]"
      }`}
    >
      <div className="border-b border-violet-500/20 bg-violet-950/30 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FaRobot className="text-amber-300" />
            <span className="font-bold text-[#E6EDF3]">AI 研究助手</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                readyCount > 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
              }`}
            >
              {readyCount > 0 ? `${readyCount} 個已連線` : "待設定金鑰"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setMessages([]);
              setError(null);
            }}
            className="text-xs text-[#6B7280] hover:text-[#E6EDF3]"
          >
            清除
          </button>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {providers.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProvider(p.id)}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                provider === p.id
                  ? p.ready
                    ? "bg-violet-600 text-white"
                    : "bg-slate-600 text-white"
                  : "bg-[#111827] text-[#9CA3AF] hover:text-white"
              }`}
            >
              {p.label}
              {p.ready ? (p.usage?.limited ? " · 達限" : " · ✓") : ""}
            </button>
          ))}
        </div>
      </div>

      {readyCount === 0 && (
        <div className="mx-4 mt-3 rounded-xl border border-amber-400/30 bg-amber-950/25 px-4 py-3">
          <p className="text-sm leading-6 text-amber-100">
            尚未連上可用的生成額度時，仍可提問：系統會依序改試 GPT／Cursor，最後改用本地規則建議。也可至後台補金鑰。
          </p>
          <Link
            href="/admin/tokens"
            target="_blank"
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-amber-400"
          >
            <FaKey className="text-[10px]" />
            前往設定金鑰
          </Link>
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="rounded-xl border border-[#1F2937] bg-[#111827]/80 p-4">
            <FaRobot className="mb-2 text-2xl text-violet-400" />
            <p className="text-sm leading-7 text-[#BFD2EA]">
              已載入本研究最佳配置與論文對比數據。選模型後可直接提問，或點下方快捷問題。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void send(q)}
                  disabled={busy}
                  className="rounded-lg border border-violet-500/30 bg-violet-950/40 px-3 py-1.5 text-left text-xs leading-5 text-violet-200 transition hover:border-violet-400/50 disabled:opacity-40"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={`${i}-${m.role}`} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-7 ${
                m.role === "user"
                  ? "bg-gradient-to-br from-violet-600 to-violet-700 text-white shadow-lg shadow-violet-900/30"
                  : "border border-[#1F2937] bg-[#111827] text-[#E6EDF3]"
              }`}
            >
              {m.role === "assistant" && <FaRobot className="mb-1.5 text-violet-400" />}
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-sm text-violet-300">
            <span className="inline-flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:300ms]" />
            </span>
            {wsiUi.analysis.aiSuggestThinking}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-violet-500/20 bg-[#111827]/90 p-3">
        {error && <p className="mb-2 text-xs text-amber-300">{error}</p>}
        {current?.usage && current.ready && (
          <div className="mb-2 h-1 overflow-hidden rounded-full bg-slate-700">
            <div
              className={`h-full rounded-full ${current.usage.percentUsed >= 70 ? "bg-amber-400" : "bg-violet-500"}`}
              style={{ width: `${Math.min(100, current.usage.percentUsed)}%` }}
            />
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            rows={2}
            placeholder={wsiUi.analysis.aiSuggestPlaceholder}
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-[#1F2937] bg-[#0B0F14] px-3 py-2 text-sm text-[#E6EDF3] outline-none focus:border-violet-500/60"
          />
          <button
            type="button"
            disabled={busy || !input.trim()}
            onClick={() => void send(input)}
            className="flex self-end items-center gap-1.5 rounded-xl bg-gradient-to-br from-violet-600 to-violet-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg disabled:opacity-40"
          >
            <FaPaperPlane className="text-xs" />
            送出
          </button>
        </div>
      </div>
    </div>
  );
}
