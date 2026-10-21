"use client";

import { useEffect, useMemo, useState } from "react";

type ProviderUsage = {
  provider: string;
  label: string;
  usedTokens: number;
  requestCount: number;
  dailyLimit: number;
  remaining: number;
  percentUsed: number;
  limited: boolean;
  updatedAt: string | null;
};

type HistoryDay = { day: string; providers: ProviderUsage[] };

type EnvStatus = {
  id: string;
  label: string;
  envSet: boolean;
  connected: boolean;
  hint: string;
};

export default function AdminTokensPage() {
  const [day, setDay] = useState("");
  const [providers, setProviders] = useState<ProviderUsage[]>([]);
  const [history, setHistory] = useState<HistoryDay[]>([]);
  const [envStatus, setEnvStatus] = useState<EnvStatus[]>([]);
  const [error, setError] = useState("");
  const [cursorKey, setCursorKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch("/api/admin/ai-usage", { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) throw new Error(d.error || "讀取失敗");
        setDay(d.day);
        setProviders(d.providers || []);
        setHistory(d.history || []);
        setError("");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "讀取失敗"));

    fetch("/api/admin/ai-env-status", { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setEnvStatus(d.providers || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const saveKeys = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/admin/ai-env", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cursorApiKey: cursorKey || undefined,
          openaiApiKey: openaiKey || undefined,
          geminiApiKey: geminiKey || undefined,
        }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || "儲存失敗");
      setSaveMsg(d.message || "已儲存");
      setCursorKey("");
      setOpenaiKey("");
      setGeminiKey("");
      load();
    } catch (e) {
      setSaveMsg(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const maxBar = useMemo(
    () => Math.max(1, ...history.flatMap((h) => h.providers.map((p) => p.usedTokens))),
    [history],
  );

  return (
    <div className="space-y-8 p-2">
      <div>
        <h1 className="text-2xl font-black text-white">AI Token 監控</h1>
        <p className="mt-2 text-sm text-slate-400">
          金鑰寫在專案 <code className="text-slate-300">.env</code> 裡<strong className="text-emerald-300">永久保存</strong>
          ，重開電腦或重啟伺服器會自動載入，不用每次重貼。啟動指令：<code className="text-cyan-300">npm run wsi</code>
        </p>
        {error && <p className="mt-2 text-sm text-amber-300">{error}</p>}
      </div>

      {envStatus.length > 0 && (
        <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
          <h2 className="mb-3 text-lg font-bold text-white">API 金鑰連線狀態</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {envStatus.map((p) => (
              <div
                key={p.id}
                className={`rounded-xl border p-4 ${
                  p.connected
                    ? "border-emerald-500/40 bg-emerald-950/20"
                    : p.envSet
                      ? "border-amber-500/40 bg-amber-950/20"
                      : "border-slate-600 bg-slate-800/50"
                }`}
              >
                <div className="font-bold text-white">{p.label}</div>
                <div
                  className={`mt-1 text-xs font-semibold ${
                    p.connected ? "text-emerald-300" : p.envSet ? "text-amber-300" : "text-slate-400"
                  }`}
                >
                  {p.connected ? "已連線" : p.envSet ? "金鑰已設、連線失敗" : "未設定金鑰"}
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-400">{p.hint}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-violet-500/30 bg-slate-900/60 p-5">
        <h2 className="mb-2 text-lg font-bold text-white">設定 API 金鑰</h2>
        <p className="mb-4 text-sm text-slate-400">
          只需設定<strong className="text-emerald-300">一次</strong>，會永久寫入 <code className="text-slate-300">.env</code>。
          之後用 <code className="text-cyan-300">npm run wsi</code> 啟動即可，不必再貼。
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-300">Gemini（aistudio.google.com）</span>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="GEMINI_API_KEY"
              className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-300">OpenAI / GPT</span>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="OPENAI_API_KEY"
              className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-300">Cursor（cursor.com → API Keys）</span>
            <input
              type="password"
              value={cursorKey}
              onChange={(e) => setCursorKey(e.target.value)}
              placeholder="CURSOR_API_KEY"
              className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={saveKeys}
            disabled={saving || (!cursorKey && !openaiKey && !geminiKey)}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
          >
            {saving ? "儲存中…" : "儲存金鑰到 .env"}
          </button>
          {saveMsg && <p className="text-sm text-cyan-300">{saveMsg}</p>}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {providers.map((p) => {
          const pct = Math.min(100, p.percentUsed);
          const over = p.limited;
          return (
            <div
              key={p.provider}
              className={`rounded-2xl border p-5 ${
                over ? "border-amber-400/50 bg-amber-950/30" : "border-slate-700 bg-slate-900/70"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-white">{p.label}</h2>
                  <p className="mt-1 text-xs text-slate-400">{p.provider}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    over ? "bg-amber-400 text-black" : "bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {over ? "已達當日限制" : "可用"}
                </span>
              </div>
              <div className="mt-4 text-3xl font-black text-white">
                {pct.toFixed(1)}
                <span className="ml-1 text-base font-semibold text-slate-400">%</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    pct >= 70 ? "bg-amber-400" : pct >= 40 ? "bg-cyan-400" : "bg-emerald-400"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                <div>已用 {p.usedTokens.toLocaleString()}</div>
                <div className="text-right">上限 {p.dailyLimit.toLocaleString()}</div>
                <div>剩餘 {p.remaining.toLocaleString()}</div>
                <div className="text-right">請求 {p.requestCount}</div>
              </div>
            </div>
          );
        })}
      </div>

      <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
        <h2 className="mb-4 text-lg font-bold text-white">近 14 日用量（圖表）</h2>
        <div className="space-y-4">
          {["cursor", "openai", "gemini", "google-ai"].map((pid) => {
            const label = providers.find((p) => p.provider === pid)?.label || pid;
            return (
              <div key={pid}>
                <div className="mb-2 text-xs font-semibold text-slate-400">{label}</div>
                <div className="flex h-24 items-end gap-1">
                  {history.map((h) => {
                    const row = h.providers.find((p) => p.provider === pid);
                    const used = row?.usedTokens ?? 0;
                    const height = Math.max(4, Math.round((used / maxBar) * 100));
                    const limited = Boolean(row?.limited);
                    return (
                      <div key={h.day} className="group relative flex flex-1 flex-col items-center justify-end">
                        <div
                          className={`w-full rounded-t ${limited ? "bg-amber-400" : "bg-violet-400"}`}
                          style={{ height: `${height}%` }}
                          title={`${h.day}: ${used.toLocaleString()} tokens`}
                        />
                        <span className="mt-1 hidden text-[9px] text-slate-500 sm:block">
                          {h.day.slice(8)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-slate-500">
          黃條／黃卡 = 當日已達 70% 限制。上限可在 .env 設定 AI_DAILY_TOKEN_LIMIT_*。
        </p>
      </section>
    </div>
  );
}
