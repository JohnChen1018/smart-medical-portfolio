"use client";

import { useCallback, useEffect, useState } from "react";

type Record = {
  id: string;
  type: string;
  result: string;
  message: string | null;
  sizeBytes: number | null;
  durationMs: number | null;
  destination: string;
  filePath: string | null;
  trigger: string;
  createdAt: string;
};

type Schedule = {
  enabled: boolean;
  runAt: string;
  runAt2: string;
  cloudPath: string;
  updatedAt: string;
  updatedBy: string | null;
};

type Job = {
  running: boolean;
  startedAt: string | null;
  lastResult: string | null;
  lastMessage: string | null;
};

type CloudFile = {
  name: string;
  label: string;
  path: string;
  mtime: string;
  sizeBytes: number;
};

function fmtSize(n: number | null) {
  if (!n) return "—";
  return `${(n / (1024 * 1024 * 1024)).toFixed(3)} GB`;
}

function fmtDuration(ms: number | null) {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms} 毫秒`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds} 秒`;
  return `${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒`;
}

const defaultSchedule: Schedule = {
  enabled: false,
  runAt: "09:00",
  runAt2: "21:00",
  cloudPath: "D:\\Backups\\smart-medical-portfolio\\s125727277\\cloud",
  updatedAt: "",
  updatedBy: null,
};

export default function BackupsPage() {
  const [schedule, setSchedule] = useState<Schedule>(defaultSchedule);
  const [records, setRecords] = useState<Record[]>([]);
  const [cloudFiles, setCloudFiles] = useState<CloudFile[]>([]);
  const [keepCount, setKeepCount] = useState(10);
  const [taskStatus, setTaskStatus] = useState("");
  const [job, setJob] = useState<Job>({ running: false, startedAt: null, lastResult: null, lastMessage: null });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    () =>
      fetch("/api/admin/backups", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          if (d.schedule) setSchedule(d.schedule);
          setRecords(d.records || []);
          setCloudFiles(d.cloudFiles || []);
          if (d.keepCount) setKeepCount(d.keepCount);
          setTaskStatus(d.taskStatus || "");
          if (d.job) setJob(d.job);
          setLoading(false);
        }),
    [],
  );

  useEffect(() => {
    load();
    const t = setInterval(load, job.running ? 3000 : 60_000);
    return () => clearInterval(t);
  }, [load, job.running]);

  const saveSchedule = async () => {
    const res = await fetch("/api/admin/backups", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(schedule),
    });
    const data = await res.json().catch(() => ({}));
    setMsg(res.ok ? "排程已儲存（可選任意時段，例如 03:30／14:15）" : `儲存失敗：${data.error || ""}`);
    load();
  };

  const runBackup = async () => {
    setMsg("正在啟動備份…");
    const res = await fetch("/api/admin/backups", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "FULL", trigger: "manual" }),
    });
    const data = await res.json();
    if (data.started) {
      setMsg("備份已在背景執行，您可以切換到其他頁面");
      sessionStorage.setItem("backup-running", "1");
      load();
    } else {
      setMsg(data.message || "備份進行中");
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">備份排程</h1>
        <p className="mt-1 text-sm text-slate-400">
          兩個時段皆可自訂（上午／下午／凌晨都行）。雲端只保留最新 {keepCount} 份，並標註年月日時分。
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-h-[320px] rounded-xl border border-slate-700 bg-[#1e293b] p-4">
          <h2 className="font-semibold">排程設定</h2>
          {loading ? (
            <p className="mt-6 text-sm text-slate-500">載入中…</p>
          ) : (
            <div className="mt-3 space-y-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={schedule.enabled}
                  onChange={(e) => setSchedule({ ...schedule, enabled: e.target.checked })}
                />
                啟用每日自動備份（兩個時段，任意 HH:MM）
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  執行時間 ①（可選任意時間）
                  <input
                    type="time"
                    className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
                    value={schedule.runAt}
                    onChange={(e) => setSchedule({ ...schedule, runAt: e.target.value })}
                  />
                </label>
                <label className="block">
                  執行時間 ②（可選任意時間）
                  <input
                    type="time"
                    className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
                    value={schedule.runAt2 || "21:00"}
                    onChange={(e) => setSchedule({ ...schedule, runAt2: e.target.value })}
                  />
                </label>
              </div>
              <label className="block">
                雲端備份資料夾
                <input
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-xs"
                  value={schedule.cloudPath || ""}
                  onChange={(e) => setSchedule({ ...schedule, cloudPath: e.target.value })}
                  placeholder="D:\Backups\...\cloud"
                />
              </label>
              <button
                type="button"
                onClick={saveSchedule}
                className="rounded-lg bg-blue-600 px-4 py-2 font-bold hover:bg-blue-500"
              >
                儲存排程
              </button>
            </div>
          )}
        </div>

        <div className="flex min-h-[320px] flex-col rounded-xl border border-slate-700 bg-[#1e293b] p-4 text-sm">
          <h2 className="font-semibold">狀態</h2>
          <p className="mt-3 text-slate-400">Windows 工作排程：{taskStatus || "—"}</p>
          <p className="mt-2 text-slate-400">
            網站內建排程：伺服器每 30 秒檢查（不必一直開著備份頁）。請開啟「啟用」並儲存後才會跑。
          </p>
          {job.running && (
            <p className="mt-3 rounded-lg bg-orange-500/15 px-3 py-2 text-orange-300">
              ● 背景備份進行中…可自由切換頁面
            </p>
          )}
          {!job.running && job.lastMessage && (
            <p className={`mt-3 rounded-lg px-3 py-2 ${job.lastResult === "success" ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
              {job.lastMessage}
            </p>
          )}
          <div className="mt-auto pt-4">
            <button
              type="button"
              disabled={job.running}
              onClick={runBackup}
              className="w-full rounded-xl bg-orange-600 px-6 py-4 text-base font-bold text-white shadow-lg transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {job.running ? "備份進行中…" : "手動備份"}
            </button>
            <p className="mt-2 text-center text-xs text-slate-500">點擊後可驗證是否真的產生雲端檔</p>
          </div>
          {msg && <p className="mt-3 text-emerald-300">{msg}</p>}
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4">
        <h2 className="font-semibold">雲端備份清單（標註時間 · 只留最新 {keepCount}）</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="px-2 py-2">備份時間</th>
                <th className="px-2 py-2">檔名</th>
                <th className="px-2 py-2">大小（GB）</th>
              </tr>
            </thead>
            <tbody>
              {cloudFiles.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-2 py-6 text-center text-slate-500">
                    尚無雲端備份，請按「手動備份」測試
                  </td>
                </tr>
              )}
              {cloudFiles.map((f) => (
                <tr key={f.name} className="border-t border-slate-700/80">
                  <td className="px-2 py-2 font-semibold text-emerald-300">{f.label}</td>
                  <td className="px-2 py-2 text-xs text-slate-300">{f.name}</td>
                  <td className="px-2 py-2">{fmtSize(f.sizeBytes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-800 text-slate-300">
            <tr>
              <th className="px-3 py-2">時間</th>
              <th className="px-3 py-2">類型</th>
              <th className="px-3 py-2">結果</th>
              <th className="px-3 py-2">大小（GB）</th>
              <th className="px-3 py-2">花了多久</th>
              <th className="px-3 py-2">目的地</th>
              <th className="px-3 py-2">觸發</th>
              <th className="px-3 py-2">備份檔</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                  尚無備份記錄，請點「手動備份」
                </td>
              </tr>
            )}
            {records.map((r) => (
              <tr key={r.id} className="border-t border-slate-700/80">
                <td className="px-3 py-2">{new Date(r.createdAt).toLocaleString("zh-TW")}</td>
                <td className="px-3 py-2">{r.type}</td>
                <td className={`px-3 py-2 ${r.result === "success" ? "text-emerald-400" : "text-red-400"}`}>
                  {r.result === "success" ? "成功" : "失敗"}
                </td>
                <td className="px-3 py-2">{fmtSize(r.sizeBytes)}</td>
                <td className="px-3 py-2">{fmtDuration(r.durationMs)}</td>
                <td className="max-w-xs px-3 py-2 text-xs">{r.destination}</td>
                <td className="px-3 py-2">
                  {r.trigger === "manual"
                    ? "手動"
                    : r.trigger === "content-save"
                      ? "內容儲存"
                      : r.trigger === "schedule"
                        ? "排程"
                        : r.trigger}
                </td>
                <td className="max-w-xs truncate px-3 py-2 text-xs text-slate-400">{r.filePath || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
