import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalSession } from "@/lib/portal-auth";

export async function POST() {
  const session = await getPortalSession();
  if (!session) return NextResponse.json({ ok: false });

  await prisma.portalAccount.update({
    where: { id: session.accountId },
    data: { isOnline: true, lastActivityAt: new Date() },
  }).catch(() => null);

  return NextResponse.json({ ok: true });
}
