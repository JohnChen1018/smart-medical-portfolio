import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalSession } from "@/lib/portal-auth";
import { logOperation } from "@/lib/portal-admin";
import { canBlockVisitors } from "@/lib/portal-permissions";
import { assertBlockableIp, invalidateBlockCache, normalizeIp } from "@/lib/ip-block";
import { clientAddress } from "@/lib/security";
import { deviceFromRequest } from "@/lib/device";

function denied() {
  return NextResponse.json({ error: "未授權" }, { status: 401 });
}

export async function GET() {
  const session = await getPortalSession();
  if (!session || !canBlockVisitors(session.role)) return denied();
  const blocks = await prisma.blockedIp.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({
    blocks: blocks.map((item) => ({
      ip: item.ip,
      note: item.note,
      createdBy: item.createdBy,
      createdAt: item.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getPortalSession();
  if (!session || !canBlockVisitors(session.role)) return denied();
  let body: { ip?: unknown; note?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請輸入 IP" }, { status: 400 });
  }
  const ip = normalizeIp(String(body?.ip || ""));
  const problem = assertBlockableIp(ip);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });
  const note = String(body?.note || "").trim().slice(0, 80);

  await prisma.blockedIp.upsert({
    where: { ip },
    create: { ip, note, createdBy: session.username },
    update: { note, createdBy: session.username },
  });
  await prisma.portalAccount.updateMany({
    where: { lastLoginIp: ip, role: "guest" },
    data: { isOnline: false, lastLogoutAt: new Date() },
  });
  invalidateBlockCache();
  await logOperation({
    accountId: session.accountId,
    username: session.username,
    role: session.role,
    action: "block-ip",
    detail: ip,
    ipAddress: clientAddress(request),
    device: deviceFromRequest(request),
  });
  return NextResponse.json({ ok: true, ip });
}

export async function DELETE(request: Request) {
  const session = await getPortalSession();
  if (!session || !canBlockVisitors(session.role)) return denied();
  let body: { ip?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請輸入 IP" }, { status: 400 });
  }
  const ip = normalizeIp(String(body?.ip || ""));
  if (!ip) return NextResponse.json({ error: "請輸入 IP" }, { status: 400 });
  await prisma.blockedIp.deleteMany({ where: { ip } });
  invalidateBlockCache();
  await logOperation({
    accountId: session.accountId,
    username: session.username,
    role: session.role,
    action: "unblock-ip",
    detail: ip,
    ipAddress: clientAddress(request),
    device: deviceFromRequest(request),
  });
  return NextResponse.json({ ok: true, ip });
}
