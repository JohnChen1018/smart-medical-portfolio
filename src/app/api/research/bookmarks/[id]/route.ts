import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalSession } from "@/lib/portal-auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getPortalSession();
  const accountId = session?.accountId || "local";
  const { id } = await context.params;

  const existing = await prisma.researchBookmark.findUnique({ where: { id } });
  if (!existing || existing.accountId !== accountId) {
    return NextResponse.json({ ok: false, error: "找不到此收藏" }, { status: 404 });
  }

  await prisma.researchBookmark.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
