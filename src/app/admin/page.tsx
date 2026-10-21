"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    todayVisits: 0,
    todayGuests: 0,
    onlineUsers: 0,
    totalRecords: 0,
  });
  const [role, setRole] = useState("");
  const [backup, setBackup] = useState<{
    enabled: boolean;
    runAt: string;
    runAt2: string;
    result: string;
    at: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/portal/session", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setRole(d.role || "");
        if (d.role !== "admin") return;
        fetch("/api/admin/backups", { credentials: "include" })
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (!data?.schedule) return;
            const latest = data.records?.[0];
            setBackup({
              enabled: Boolean(data.schedule.enabled),
              runAt: data.schedule.runAt || "",
              runAt2: data.schedule.runAt2 || "",
              result: latest?.result || "",
              at: latest?.createdAt || "",
            });
          })
          .catch(() => null);
      });
    fetch("/api/admin/logs", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setStats(d.stats || stats));
  }, []);

  const cards = [
    { label: "今日瀏覽人次", value: stats.todayVisits, color: "text-blue-400" },
    { label: "今日訪客", value: stats.todayGuests, color: "text-purple-400" },
    { label: "目前上線", value: stats.onlineUsers, color: "text-emerald-400" },
    { label: "記錄總數", value: stats.totalRecords, color: "text-amber-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">儀表板</h1>
        <p className="mt-1 text-sm text-slate-400">快速查看網站狀態與常用功能</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-700 bg-[#1e293b] p-4">
            <p className="text-sm text-slate-400">{c.label}</p>
            <p className={`mt-2 text-3xl font-black ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {role === "admin" && backup && (
        <Link href="/admin/backups" className="block rounded-xl border border-slate-700 bg-[#1e293b] p-4 hover:border-orange-500/50">
          <p className="font-semibold">系統維護</p>
          <p className="mt-2 text-sm text-slate-300">
            備份排程 {backup.enabled ? "開著" : "關著"}
            {backup.runAt ? `，${backup.runAt}` : ""}
            {backup.runAt2 ? ` 與 ${backup.runAt2}` : ""}
          </p>
          <p className={`mt-1 text-sm ${backup.result === "success" ? "text-emerald-400" : backup.result ? "text-red-400" : "text-slate-400"}`}>
            {backup.result === "success"
              ? `上次備份成功${backup.at ? `，${new Date(backup.at).toLocaleString("zh-TW")}` : ""}`
              : backup.result
                ? `上次備份失敗${backup.at ? `，${new Date(backup.at).toLocaleString("zh-TW")}` : ""}`
                : "還沒有備份記錄"}
          </p>
        </Link>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/content" className="rounded-xl border border-slate-700 bg-[#1e293b] p-4 hover:border-emerald-500/50">
          <p className="font-semibold">內容修改</p>
          <p className="mt-1 text-sm text-slate-400">直接在網頁上點選文字編輯</p>
        </Link>
        <Link href="/admin/logs" className="rounded-xl border border-slate-700 bg-[#1e293b] p-4 hover:border-blue-500/50">
          <p className="font-semibold">操作記錄</p>
          <p className="mt-1 text-sm text-slate-400">依日期分組查看訪客與使用者</p>
        </Link>
        {role === "admin" && (
          <>
            <Link href="/admin/backups" className="rounded-xl border border-slate-700 bg-[#1e293b] p-4 hover:border-orange-500/50">
              <p className="font-semibold">備份排程</p>
              <p className="mt-1 text-sm text-slate-400">自動備份到雲端資料夾</p>
            </Link>
            <Link href="/admin/accounts" className="rounded-xl border border-slate-700 bg-[#1e293b] p-4 hover:border-violet-500/50">
              <p className="font-semibold">帳號管理</p>
              <p className="mt-1 text-sm text-slate-400">新增使用者或管理員</p>
            </Link>
          </>
        )}
        <a href="/" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-700 bg-[#1e293b] p-4 hover:border-slate-500">
          <p className="font-semibold">開啟前台</p>
          <p className="mt-1 text-sm text-slate-400">在新分頁預覽訪客看到的畫面</p>
        </a>
      </div>
    </div>
  );
}
