import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  clearPortalCookieHeader,
  getClientIp,
  getPortalSession,
} from "@/lib/portal-auth";
import { logOperation } from "@/lib/portal-admin";
import { deviceFromRequest } from "@/lib/device";

export async function POST(request: Request) {
  const session = await getPortalSession();
  const body = await request.json().catch(() => ({}));
  const guestId = body.guestId as string | undefined;

  if (session) {
    await prisma.portalAccount.update({
      where: { id: session.accountId },
      data: { isOnline: false, lastLogoutAt: new Date() },
    }).catch(() => null);

    const latest = await prisma.operationLog.findFirst({
      where: { accountId: session.accountId, action: "login", endedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (latest) {
      await prisma.operationLog.update({
        where: { id: latest.id },
        data: { endedAt: new Date() },
      });
    }

    await logOperation({
      accountId: session.accountId,
      username: session.username,
      role: session.role,
      action: "logout",
      detail: "使用者離開網站",
      ipAddress: getClientIp(request),
      device: deviceFromRequest(request),
    });
  }

  if (guestId) {
    await prisma.portalAccount.update({
      where: { id: guestId },
      data: { isOnline: false, lastLogoutAt: new Date() },
    }).catch(() => null);

    const latest = await prisma.operationLog.findFirst({
      where: { accountId: guestId, action: "login", endedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (latest) {
      await prisma.operationLog.update({
        where: { id: latest.id },
        data: { endedAt: new Date() },
      });
    }
  }

  const response = NextResponse.json({ success: true });
  response.headers.set("Set-Cookie", clearPortalCookieHeader());
  return response;
}
