import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getPortalSession } from "@/lib/portal-auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getPortalSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.displayName !== undefined) data.displayName = body.displayName;
  if (body.role !== undefined) data.role = body.role;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.password) data.passwordHash = await bcrypt.hash(String(body.password), 10);
  if (body.resetTotp) {
    data.totpSecret = null;
    data.totpEnabled = false;
    data.totpRecovery = null;
  }

  const updated = await prisma.portalAccount.update({ where: { id }, data });
  const { passwordHash: _password, totpSecret: _secret, totpRecovery: _recovery, ...user } = updated;
  return NextResponse.json({ user });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getPortalSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const { id } = await params;
  if (id === session.accountId) {
    return NextResponse.json({ error: "不能刪除自己" }, { status: 400 });
  }

  await prisma.portalAccount.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
