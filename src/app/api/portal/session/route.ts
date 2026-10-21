import { NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  const account = await prisma.portalAccount.findUnique({
    where: { id: session.accountId },
  });

  return NextResponse.json({
    authenticated: true,
    username: session.username,
    displayName: account?.displayName || session.username,
    role: session.role,
    canAccessAdmin: session.role === "admin" || session.role === "user",
  });
}
