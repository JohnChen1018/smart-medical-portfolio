"use client";

import { useEffect, useState } from "react";
import { ROLE_LABELS } from "@/lib/portal-permissions";

type SessionItem = {
  id: string;
  username: string;
  role: string;
  ipAddress: string | null;
  device?: string | null;
  loginAt: string;
  leftAt: string | null;
  durationMin: string;
  detail: string | null;
  dateKey: string;
  kind?: "session" | "op";
  actionLabel?: string;
};

type Group = {
  date: string;
  items: SessionItem[];
  guestCount: number;
  userCount: number;
};

type Stats = {
  todayVisits: number;
  todayGuests: number;
  onlineUsers: number;
  totalRecords: number;
};

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("zh-TW", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function isOwnMachine(ip: string) {
  const value = ip.toLowerCase();
  return value === "127.0.0.1" || value === "::1" || value === "localhost" || value.startsWith("127.");
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("zh-TW");
}

export default function LogsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [stats, setStats] = useState<Stats>({ todayVisits: 0, todayGuests: 0, onlineUsers: 0, totalRecords: 0 });
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [openDates, setOpenDates] = useState<Set<string>>(new Set());
  const [blocked, setBlocked] = useState<{ ip: string; createdBy: string | null; createdAt: string }[]>([]);
  const [ipDraft, setIpDraft] = useState("");
  const [blockError, setBlockError] = useState("");
  const [blockNote, setBlockNote] = useState("");
  const [pendingIp, setPendingIp] = useState("");

  const loadBlocks = () => {
    fetch("/api/admin/blocks", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setBlocked(d.blocks || []))
      .catch(() => null);
  };

  const load = () => {
    fetch(`/api/admin/logs?filter=${filter}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setGroups(d.groups || []);
        setStats(d.stats || stats);
        if (d.groups?.length && openDates.size === 0) {
          setOpenDates(new Set([d.groups[0].date]));
        }
      });
    loadBlocks();
  };

  const blockIp = async (ip: string) => {
    setBlockError("");
    setBlockNote("");
    const res = await fetch("/api/admin/blocks", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip }),
    });
    const data = await res.json();
    if (!res.ok) {
      setBlockError(data.error || "封鎖失敗");
      return;
    }
    setIpDraft("");
    setPendingIp("");
    setBlockNote(`${ip} 已封鎖`);
    loadBlocks();
  };

  const unblockIp = async (ip: string) => {
    setBlockError("");
    setBlockNote("");
    const res = await fetch("/api/admin/blocks", {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBlockError(data.error || "解除失敗");
      return;
    }
    setIpDraft("");
    setPendingIp("");
    setBlockNote(`${ip} 已解除封鎖`);
    loadBlocks();
  };

  const blockedSet = new Set(blocked.map((item) => item.ip));

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [filter]);

  const toggleDate = (date: string) => {
    setOpenDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const filteredGroups = groups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => {
        const hay = `${item.username} ${item.role} ${item.ipAddress} ${item.device || ""} ${item.detail}`.toLowerCase();
        return hay.includes(q.toLowerCase());
      }),
    }))
    .filter((g) => g.items.length > 0);

  const statCards = [
    { label: "今日瀏覽", value: stats.todayVisits, color: "text-blue-400" },
    { label: "今日訪客", value: stats.todayGuests, color: "text-purple-400" },
    { label: "目前上線", value: stats.onlineUsers, color: "text-emerald-400" },
    { label: "記錄總數", value: stats.totalRecords, color: "text-amber-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">操作記錄</h1>
      </div>

      <section className="rounded-xl border border-slate-700 bg-[#1e293b] p-4">
        <h2 className="font-semibold">封鎖位址</h2>
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const ip = ipDraft.trim();
            if (ip) setPendingIp(ip);
          }}
        >
          <input
            value={ipDraft}
            onChange={(event) => setIpDraft(event.target.value)}
            placeholder="例如 203.0.113.10"
            className="w-full max-w-xs rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white">
            封鎖
          </button>
          <button
            type="button"
            onClick={() => {
              const ip = ipDraft.trim();
              if (ip) void unblockIp(ip);
            }}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
          >
            解除封鎖
          </button>
        </form>
        {pendingIp && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span>封鎖 {pendingIp} 之後，這個位址就看不到網站。</span>
            <button type="button" onClick={() => void blockIp(pendingIp)} className="rounded-lg bg-red-500 px-3 py-1.5 font-bold text-white">
              確定封鎖
            </button>
            <button type="button" onClick={() => setPendingIp("")} className="rounded-lg border border-slate-600 px-3 py-1.5">
              取消
            </button>
          </div>
        )}
        {blockError && <p className="mt-2 text-sm text-red-300">{blockError}</p>}
        {blockNote && <p className="mt-2 text-sm text-emerald-300">{blockNote}</p>}
        <ul className="mt-4 space-y-2">
          {blocked.length === 0 && <li className="text-sm text-slate-500">目前沒有封鎖的位址。</li>}
          {blocked.map((item) => (
            <li key={item.ip} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm">
              <span>
                {item.ip}
                <span className="ml-2 text-xs text-slate-500">{item.createdBy || ""}</span>
              </span>
              <button type="button" onClick={() => void unblockIp(item.ip)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-bold text-white">
                解除封鎖
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-700 bg-[#1e293b] p-4">
            <p className="text-sm text-slate-400">{c.label}</p>
            <p className={`mt-1 text-2xl font-black ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: "all", label: "全部" },
          { key: "today", label: "今日" },
          { key: "content", label: "內容儲存" },
          { key: "guest", label: "僅訪客" },
          { key: "user", label: "僅使用者" },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              filter === f.key ? "bg-blue-600 text-white" : "border border-slate-600 text-slate-300 hover:bg-slate-800"
            }`}
          >
            {f.label}
          </button>
        ))}
        <input
          className="ml-auto w-full max-w-xs rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm"
          placeholder="搜尋姓名、IP…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filteredGroups.length === 0 && (
          <p className="rounded-xl border border-slate-700 bg-[#1e293b] p-8 text-center text-slate-500">尚無記錄</p>
        )}
        {filteredGroups.map((group) => {
          const open = openDates.has(group.date);
          return (
            <div key={group.date} className="overflow-hidden rounded-xl border border-slate-700 bg-[#1e293b]">
              <button
                type="button"
                onClick={() => toggleDate(group.date)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{open ? "▼" : "▶"}</span>
                  <span className="font-semibold">{group.date}</span>
                  <span className="text-sm text-slate-400">
                    {group.items.length} 筆 · 訪客 {group.guestCount} · 使用者 {group.userCount}
                  </span>
                </div>
              </button>
              {open && (
                <div className="divide-y divide-slate-700/80 border-t border-slate-700">
                  {group.items.map((item, idx) => (
                    <div key={item.id} className="flex flex-wrap items-start gap-4 px-4 py-3 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-300">
                        {idx + 1}
                      </span>
                      <div className="min-w-[120px] flex-1">
                        <p className="font-medium">{item.username}</p>
                        <p className="text-xs text-slate-500">{item.role === "visit" ? "只瀏覽" : ROLE_LABELS[item.role] || item.role}</p>
                        {"actionLabel" in item && item.actionLabel && (
                          <p className="mt-1 text-xs font-semibold text-cyan-300">{String(item.actionLabel)}</p>
                        )}
                        {item.detail && (
                          <p className="mt-1 text-xs text-slate-400">{item.detail}</p>
                        )}
                      </div>
                      <div className="min-w-[140px]">
                        <p className="text-xs text-slate-500">時間</p>
                        <p>{fmtDate(item.loginAt)}</p>
                      </div>
                      <div className="min-w-[140px]">
                        <p className="text-xs text-slate-500">離開</p>
                        <p>{item.leftAt ? fmtDate(item.leftAt) : item.kind === "op" ? "—" : "進行中"}</p>
                      </div>
                      <div className="min-w-[80px]">
                        <p className="text-xs text-slate-500">停留</p>
                        <p className={item.durationMin === "進行中" ? "text-emerald-400" : ""}>{item.durationMin}</p>
                      </div>
                      <div className="min-w-[72px]">
                        <p className="text-xs text-slate-500">裝置</p>
                        <p>{item.device || "—"}</p>
                      </div>
                      <div className="min-w-[140px]">
                        <p className="text-xs text-slate-500">IP</p>
                        <p>{item.ipAddress || "—"}</p>
                        {item.ipAddress && item.ipAddress !== "local" && item.ipAddress !== "unknown" && !isOwnMachine(item.ipAddress) && (
                          blockedSet.has(item.ipAddress) ? (
                            <button type="button" onClick={() => void unblockIp(item.ipAddress || "")} className="mt-1 rounded-lg bg-emerald-600 px-2 py-1 text-xs font-bold text-white">
                              解除封鎖
                            </button>
                          ) : (
                            <button type="button" onClick={() => setPendingIp(item.ipAddress || "")} className="mt-1 text-xs text-red-300">
                              封鎖這個位址
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
