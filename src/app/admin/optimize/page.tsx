"use client";

import { useCallback, useEffect, useState } from "react";

type Metrics = {
  nextBytes: number;
  nextCacheBytes: number;
  dataBytes: number;
  srcBytes: number;
  apiCacheEntries: number;
  buildMs: number | null;
};

type LogEntry = {
  id: string;
  startedAt: string;
  finishedAt: string;
  ok: boolean;
  message: string;
  backupFile: string | null;
  backupLabel: string | null;
  before: Metrics;
  after: Metrics;
  saved: { diskBytes: number; buildMs: number | null; apiCacheEntries: number };
  steps: string[];
};

type Job = {
  running: boolean;
  startedAt: string | null;
  lastMessage: string | null;
};

function fmt(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtMs(ms: number | null) {
  if (ms == null) return "—";
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} 秒` : `${ms} ms`;
}

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("zh-TW", { hour12: false });
  } catch {
    return iso;
  }
}

export default function AdminOptimizePage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [job, setJob] = useState<Job>({ running: false, startedAt: null, lastMessage: null });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    () =>
      fetch("/api/admin/optimize", { credentials: "include", cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (!d.ok) throw new Error(d.error || "讀取失敗");
          setLogs(d.logs || []);
          setJob(d.job || { running: false, startedAt: null, lastMessage: null });
          setLoading(false);
        })
        .catch((e) => {
          setMsg(e instanceof Error ? e.message : "讀取失敗");
          setLoading(false);
        }),
    [],
  );

  useEffect(() => {
    load();
    const ms = job.running ? 3000 : 15000;
    const t = setInterval(load, ms);
    return () => clearInterval(t);
  }, [load, job.running]);

  const runOptimize = async () => {
    setMsg("");
    const res = await fetch("/api/admin/optimize", {
      method: "POST",
      credentials: "include",
    });
    const d = await res.json();
    if (!d.ok) {
      setMsg(d.error || "啟動失敗");
      return;
    }
    setMsg(d.message || "已開始優化");
    sessionStorage.setItem("optimize-running", "1");
    load();
  };

  if (loading) {
    return <p className="text-slate-400">載入優化記錄…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">優化</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
          按「一鍵優化」會<strong className="text-amber-200">先自動備份整個專案</strong>
          （本機＋雲端），備份成功後才清除建置快取、重建 production bundle，並記錄優化前後數據與節省時間。
        </p>
      </div>

      <section className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/40 to-slate-900/60 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            disabled={job.running}
            onClick={() => void runOptimize()}
            className="rounded-xl bg-violet-600 px-6 py-3 text-base font-bold text-white shadow-lg shadow-violet-900/40 disabled:opacity-50"
          >
            {job.running ? "優化進行中…" : "一鍵優化"}
          </button>
          {job.running && (
            <p className="text-sm text-violet-200">
              {job.lastMessage || "備份 → 清快取 → next build…"}
            </p>
          )}
        </div>
        {msg && <p className="mt-3 text-sm text-cyan-300">{msg}</p>}
        <p className="mt-4 text-xs text-slate-500">
          若優化後網站異常，請至「備份排程」還原最新 PRE-OPTIMIZE 備份檔。
        </p>
      </section>

      <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
        <h2 className="mb-4 text-lg font-bold text-white">優化記錄</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-slate-500">尚無記錄，按上方按鈕執行第一次優化。</p>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <article
                key={log.id}
                className={`rounded-xl border p-4 ${
                  log.ok ? "border-emerald-500/30 bg-emerald-950/10" : "border-amber-500/30 bg-amber-950/10"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        log.ok ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {log.ok ? "成功" : "失敗／中止"}
                    </span>
                    <p className="mt-2 text-sm text-slate-200">{log.message}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {fmtTime(log.startedAt)}
                      {log.backupLabel ? ` · 備份 ${log.backupLabel}` : ""}
                    </p>
                  </div>
                  {log.ok && (
                    <div className="text-right text-sm">
                      <div className="font-bold text-emerald-300">節省磁碟 {fmt(log.saved.diskBytes)}</div>
                      {log.saved.buildMs != null && (
                        <div className="text-violet-300">建置快 {fmtMs(log.saved.buildMs)}</div>
                      )}
                      {log.saved.apiCacheEntries > 0 && (
                        <div className="text-slate-400">清 API 快取 {log.saved.apiCacheEntries} 筆</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-xs">
                    <thead>
                      <tr className="text-left text-slate-500">
                        <th className="pb-2 pr-4">項目</th>
                        <th className="pb-2 pr-4 text-right">優化前</th>
                        <th className="pb-2 text-right">優化後</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-300">
                      <tr className="border-t border-slate-800">
                        <td className="py-2 pr-4">.next 總大小</td>
                        <td className="py-2 pr-4 text-right font-mono">{fmt(log.before.nextBytes)}</td>
                        <td className="py-2 text-right font-mono">{fmt(log.after.nextBytes)}</td>
                      </tr>
                      <tr className="border-t border-slate-800">
                        <td className="py-2 pr-4">.next/cache</td>
                        <td className="py-2 pr-4 text-right font-mono">{fmt(log.before.nextCacheBytes)}</td>
                        <td className="py-2 text-right font-mono">{fmt(log.after.nextCacheBytes)}</td>
                      </tr>
                      <tr className="border-t border-slate-800">
                        <td className="py-2 pr-4">data/</td>
                        <td className="py-2 pr-4 text-right font-mono">{fmt(log.before.dataBytes)}</td>
                        <td className="py-2 text-right font-mono">{fmt(log.after.dataBytes)}</td>
                      </tr>
                      <tr className="border-t border-slate-800">
                        <td className="py-2 pr-4">建置耗時</td>
                        <td className="py-2 pr-4 text-right font-mono">—</td>
                        <td className="py-2 text-right font-mono">{fmtMs(log.after.buildMs)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="mt-3 text-[10px] text-slate-600">步驟：{log.steps.join(" → ")}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
