"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const allNav = [
  { href: "/admin", label: "儀表板", adminOnly: false },
  { href: "/admin/tokens", label: "AI Token", adminOnly: true },
  { href: "/admin/accounts", label: "帳號管理", adminOnly: true },
  { href: "/admin/backups", label: "備份排程", adminOnly: true },
  { href: "/admin/optimize", label: "優化", adminOnly: true },
  { href: "/admin/logs", label: "操作記錄", adminOnly: false },
  { href: "/admin/content", label: "內容修改", adminOnly: false },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [backupRunning, setBackupRunning] = useState(false);

  useEffect(() => {
    fetch("/api/portal/session", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated || !data.canAccessAdmin) {
          router.replace("/");
          return;
        }
        setUser(data.displayName || data.username);
        setRole(data.role);
        setLoading(false);
      })
      .catch(() => router.replace("/"));
  }, [router]);

  useEffect(() => {
    if (role !== "admin") return;
    const poll = () => {
      fetch("/api/admin/backups", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          const running = Boolean(d.job?.running);
          setBackupRunning(running);
          if (!running) sessionStorage.removeItem("backup-running");
        })
        .catch(() => {});
    };
    poll();
    // 每 30 秒喚醒排程檢查，並更新備份狀態
    const ms = sessionStorage.getItem("backup-running") ? 3000 : 30_000;
    const t = setInterval(poll, ms);
    return () => clearInterval(t);
  }, [role]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f172a] text-slate-300">
        載入管理後台…
      </div>
    );
  }

  const nav = allNav.filter((item) => !item.adminOnly || role === "admin");

  return (
    <div className="flex min-h-screen w-full bg-[#0f172a] text-slate-100">
      <aside className="flex w-52 shrink-0 flex-col border-r border-slate-700/80 bg-[#111827] p-4">
        <div className="mb-4 border-b border-slate-700 pb-3">
          <p className="text-xs text-slate-400">管理後台</p>
          <p className="font-bold text-white">{user}</p>
          <p className="mt-1 text-xs text-slate-500">
            {role === "admin" ? "管理員" : "使用者"}
          </p>
          {backupRunning && (
            <p className="mt-2 rounded bg-orange-500/15 px-2 py-1 text-xs text-orange-300">備份進行中…</p>
          )}
        </div>
        <nav className="flex-1 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm transition ${
                pathname === item.href
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-2 border-t border-slate-700 pt-4 text-sm">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-slate-400 hover:text-white"
          >
            開啟前台預覽 ↗
          </a>
          <Link href="/" className="block text-slate-400 hover:text-white">
            ← 回前台
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
