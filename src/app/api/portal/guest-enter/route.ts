import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/portal-auth";
import { ensurePortalAdmin, logOperation } from "@/lib/portal-admin";
import { allowRequest, clientAddress } from "@/lib/security";
import { deviceFromRequest } from "@/lib/device";

export async function POST(request: Request) {
  if (!allowRequest(`guest:${clientAddress(request)}`, 8, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "嘗試太多次，請稍後再試" }, { status: 429 });
  }
  await ensurePortalAdmin();
  let body: { displayName?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請輸入姓名" }, { status: 400 });
  }
  const name = String(body?.displayName || "").trim().replace(/[\u0000-\u001f]/g, "");
  if (!name || name.length > 40) {
    return NextResponse.json({ error: "請輸入姓名" }, { status: 400 });
  }

  const ip = getClientIp(request);
  const device = deviceFromRequest(request);
  const guest = await prisma.portalAccount.create({
    data: {
      username: `guest_${Date.now()}`,
      displayName: name,
      role: "guest",
      source: "訪客登入",
      isOnline: true,
      lastLoginAt: new Date(),
      lastActivityAt: new Date(),
      lastLoginIp: ip,
      lastDevice: device || null,
      loginCount: 1,
    },
  });

  await logOperation({
    accountId: guest.id,
    username: name,
    role: "guest",
    action: "login",
    detail: "訪客進入網站",
    ipAddress: ip,
    device,
  });

  return NextResponse.json({
    success: true,
    guestId: guest.id,
    displayName: name,
  });
}
