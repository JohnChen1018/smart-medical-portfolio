"use client";

import { useEffect, useState } from "react";
import { ROLE_HELP } from "@/lib/portal-permissions";

type User = {
  id: string;
  username: string;
  displayName: string | null;
  role: string;
  isOnline: boolean;
  loginCount: number;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  lastDevice: string | null;
  totpEnabled: boolean;
  source: string;
};

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("zh-TW");
}

export default function AccountsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ username: "", password: "", displayName: "", role: "user" });
  const [q, setQ] = useState("");

  const load = () =>
    fetch("/api/admin/users", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []));

  useEffect(() => {
    load();
  }, []);

  const createUser = async () => {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "新增失敗");
      return;
    }
    setMsg(`已新增 ${form.role === "admin" ? "管理員" : "使用者"}：${form.username}`);
    setForm({ username: "", password: "", displayName: "", role: "user" });
    load();
  };

  const resetPassword = async (id: string) => {
    const password = prompt("輸入新密碼");
    if (!password) return;
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setMsg("密碼已重設");
    load();
  };

  const resetTotp = async (id: string) => {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetTotp: true }),
    });
    setMsg("已重設驗證，下次登入要重新掃手機");
    load();
  };

  const filtered = users.filter((u) => {
    const hay = `${u.username} ${u.displayName} ${u.role} ${u.source}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">帳號管理</h1>
      </div>

      <div className="grid gap-4 rounded-xl border border-slate-700 bg-[#1e293b] p-4 lg:grid-cols-2">
        <div>
          <h2 className="font-semibold">新增使用者</h2>
          <div className="mt-3 grid gap-2">
            <input className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm" placeholder="帳號" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            <input className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm" placeholder="顯示名稱" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
            <input type="password" className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm" placeholder="密碼" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <select className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="user">使用者</option>
              <option value="admin">管理員</option>
            </select>
            <p className="text-xs text-slate-400">
              {form.role === "admin" ? ROLE_HELP.admin : ROLE_HELP.user}
            </p>
            <button type="button" onClick={createUser} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold hover:bg-emerald-500">
              新增使用者
            </button>
          </div>
        </div>
        <div className="space-y-3 text-sm text-slate-400">
          <div className="rounded-lg border border-slate-600 bg-slate-900/50 p-3">
            <p className="font-medium text-slate-200">管理員 vs 使用者</p>
            <p className="mt-2"><span className="text-emerald-300">管理員</span>：帳號管理、備份排程、操作記錄、內容修改</p>
            <p className="mt-1"><span className="text-blue-300">使用者</span>：只能改內容、看操作記錄（不能管帳號與備份）</p>
          </div>
          <p>預設管理員：<code className="text-emerald-300">m215</code> / <code className="text-emerald-300">m215</code></p>
          {msg && <p className="text-emerald-300">{msg}</p>}
        </div>
      </div>

      <input className="w-full max-w-md rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm" placeholder="搜尋所有欄位…" value={q} onChange={(e) => setQ(e.target.value)} />

      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-800 text-slate-300">
            <tr>
              <th className="px-3 py-2">帳號</th>
              <th className="px-3 py-2">角色</th>
              <th className="px-3 py-2">狀態</th>
              <th className="px-3 py-2">登入次數</th>
              <th className="px-3 py-2">最後登入</th>
              <th className="px-3 py-2">雙重認證</th>
              <th className="px-3 py-2">來源</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t border-slate-700/80">
                <td className="px-3 py-2">
                  <div className="font-medium">{u.displayName || u.username}</div>
                  <div className="text-xs text-slate-500">{u.username}</div>
                </td>
                <td className="px-3 py-2">{u.role === "guest" ? "訪客" : u.role === "admin" ? "管理員" : "使用者"}</td>
                <td className="px-3 py-2"><span className={u.isOnline ? "text-emerald-400" : "text-slate-500"}>{u.isOnline ? "● 上線中" : "離線"}</span></td>
                <td className="px-3 py-2">{u.loginCount}</td>
                <td className="px-3 py-2"><div>{fmt(u.lastLoginAt)}</div><div className="text-xs text-slate-500">{[u.lastDevice, u.lastLoginIp].filter(Boolean).join(" · ")}</div></td>
                <td className="px-3 py-2">{u.role === "guest" ? "—" : u.totpEnabled ? "已開啟" : "尚未設定"}</td>
                <td className="px-3 py-2">{u.source}</td>
                <td className="px-3 py-2">
                  {u.role !== "guest" && (
                    <div className="flex flex-col items-start gap-1">
                      <button type="button" className="text-blue-400 hover:underline" onClick={() => resetPassword(u.id)}>重設密碼</button>
                      <button type="button" className="text-emerald-300 hover:underline" onClick={() => resetTotp(u.id)}>重設驗證</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
