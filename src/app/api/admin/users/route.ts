import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getPortalSession } from "@/lib/portal-auth";
import { canManageAccounts } from "@/lib/portal-permissions";

export async function GET() {
  const session = await getPortalSession();
  if (!session || !canManageAccounts(session.role)) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const users = await prisma.portalAccount.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    users: users.map(({ passwordHash: _password, totpSecret: _secret, totpRecovery: _recovery, ...user }) => user),
  });
}

export async function POST(request: Request) {
  const session = await getPortalSession();
  if (!session || !canManageAccounts(session.role)) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const { username, password, displayName, role } = await request.json();
  const user = String(username || "").trim();
  const pass = String(password || "").trim();
  if (!user || !pass) {
    return NextResponse.json({ error: "帳號與密碼必填" }, { status: 400 });
  }

  const exists = await prisma.portalAccount.findUnique({ where: { username: user } });
  if (exists) {
    return NextResponse.json({ error: "帳號已存在" }, { status: 409 });
  }

  const created = await prisma.portalAccount.create({
    data: {
      username: user,
      displayName: displayName || user,
      passwordHash: await bcrypt.hash(pass, 10),
      role: role === "admin" ? "admin" : "user",
      permissions: role === "admin" ? "accounts,backups,logs,content" : "logs,content",
      source: "手動新增",
    },
  });

  const { passwordHash: _password, totpSecret: _secret, totpRecovery: _recovery, ...user } = created;
  return NextResponse.json({ user });
}
