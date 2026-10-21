import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalSession } from "@/lib/portal-auth";
import { canViewLogs } from "@/lib/portal-permissions";

function dayKey(d: Date) {
  return d.toLocaleDateString("zh-TW");
}

function dayKeyFromVisitDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  return new Date(year, month - 1, day).toLocaleDateString("zh-TW");
}

const ACTION_LABELS: Record<string, string> = {
  login: "登入",
  logout: "登出",
  "guest-enter": "訪客進入",
  "content-save": "內容儲存",
  "backup-run": "備份",
  "schedule-save": "備份排程",
  "block-ip": "封鎖位址",
  "unblock-ip": "解除封鎖",
};

export async function GET(request: Request) {
  const session = await getPortalSession();
  if (!session || !canViewLogs(session.role)) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "all";

  const logs = await prisma.operationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const today = dayKey(new Date());

  // 登入工作階段（保留原邏輯）
  const sessions = logs
    .filter((l) => l.action === "login")
    .map((login) => {
      const logout = logs.find(
        (l) =>
          l.action === "logout" &&
          l.username === login.username &&
          new Date(l.createdAt) >= new Date(login.createdAt),
      );
      const end = login.endedAt || logout?.createdAt || null;
      const start = new Date(login.createdAt);
      const endDate = end ? new Date(end) : null;
      let durationMin = "進行中";
      if (endDate) {
        const mins = Math.max(1, Math.round((endDate.getTime() - start.getTime()) / 60000));
        durationMin = `${mins} 分鐘`;
      }
      return {
        id: login.id,
        username: login.username,
        role: login.role,
        ipAddress: login.ipAddress,
        device: login.device,
        loginAt: login.createdAt,
        leftAt: end,
        durationMin,
        detail: login.detail,
        dateKey: dayKey(start),
        kind: "session" as const,
        actionLabel: "登入",
      };
    });

  // 內容儲存／其他操作
  const ops = logs
    .filter((l) => l.action !== "login" && l.action !== "logout")
    .map((l) => ({
      id: l.id,
      username: l.username,
      role: l.role,
      ipAddress: l.ipAddress,
      device: l.device,
      loginAt: l.createdAt,
      leftAt: null as string | null,
      durationMin: "—",
      detail: l.detail,
      dateKey: dayKey(new Date(l.createdAt)),
      kind: "op" as const,
      actionLabel: ACTION_LABELS[l.action] || l.action,
    }));

  const visits = await prisma.pageVisit.findMany({
    orderBy: { updatedAt: "desc" },
    take: 300,
  });
  const seen = new Set(
    [...sessions, ...ops].filter((item) => item.ipAddress).map((item) => `${item.ipAddress}|${item.dateKey}`),
  );
  const browse = new Map<string, { ip: string; device: string | null; dateKey: string; at: Date; count: number }>();
  for (const visit of visits) {
    if (!visit.ipAddress || visit.ipAddress === "unknown") continue;
    const dateKey = dayKeyFromVisitDate(visit.date);
    const key = `${visit.ipAddress}|${dateKey}`;
    if (seen.has(key)) continue;
    const current = browse.get(key);
    if (!current) {
      browse.set(key, {
        ip: visit.ipAddress,
        device: visit.device,
        dateKey,
        at: visit.updatedAt,
        count: visit.count,
      });
      continue;
    }
    current.count += visit.count;
    if (!current.device && visit.device) current.device = visit.device;
    if (visit.updatedAt > current.at) current.at = visit.updatedAt;
  }

  const browseItems = Array.from(browse.values()).map((item) => ({
    id: `visit-${item.ip}-${item.dateKey}`,
    username: "未留下姓名",
    role: "visit",
    ipAddress: item.ip,
    device: item.device,
    loginAt: item.at,
    leftAt: null as string | null,
    durationMin: "—",
    detail: item.count > 1 ? `看了 ${item.count} 次` : null,
    dateKey: item.dateKey,
    kind: "op" as const,
    actionLabel: "瀏覽",
  }));

  let items = [...sessions, ...ops, ...browseItems].sort(
    (a, b) => new Date(b.loginAt).getTime() - new Date(a.loginAt).getTime(),
  );

  if (filter === "guest") items = items.filter((s) => s.role === "guest");
  if (filter === "user") items = items.filter((s) => s.role === "user" || s.role === "admin");
  if (filter === "today") items = items.filter((s) => s.dateKey === today);
  if (filter === "content") items = items.filter((s) => s.actionLabel === "內容儲存");

  const groupsMap = new Map<string, typeof items>();
  for (const s of items) {
    const list = groupsMap.get(s.dateKey) || [];
    list.push(s);
    groupsMap.set(s.dateKey, list);
  }

  const groups = Array.from(groupsMap.entries()).map(([date, groupItems]) => ({
    date,
    items: groupItems,
    guestCount: groupItems.filter((i) => i.role === "guest").length,
    userCount: groupItems.filter((i) => i.role === "user" || i.role === "admin").length,
  }));

  const onlineUsers = await prisma.portalAccount.count({ where: { isOnline: true } });

  return NextResponse.json({
    stats: {
      todayVisits: sessions.filter((s) => s.dateKey === today).length,
      todayGuests: sessions.filter((s) => s.dateKey === today && s.role === "guest").length,
      onlineUsers,
      totalRecords: items.length,
      todayContentSaves: ops.filter((o) => o.dateKey === today && o.actionLabel === "內容儲存").length,
    },
    groups,
  });
}
