import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  createPortalSession,
  getClientIp,
  portalCookieHeader,
} from "@/lib/portal-auth";
import { ensurePortalAdmin, logOperation } from "@/lib/portal-admin";
import { allowRequest, clientAddress } from "@/lib/security";
import { deviceFromRequest } from "@/lib/device";
import { hashRecoveryCode, newRecoveryCodes, portalTotpSetup, portalTotpValid } from "@/lib/portal-totp";

const DUMMY_PASSWORD_HASH = bcrypt.hashSync("portal-login-timing-placeholder", 10);

function denied() {
  const response = NextResponse.json({ error: "帳號或密碼錯誤" }, { status: 401 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: Request) {
  if (!allowRequest(`portal-login:${clientAddress(request)}`, 10, 15 * 60 * 1000)) {
    const response = NextResponse.json({ error: "嘗試太多次，請稍後再試" }, { status: 429 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
  await ensurePortalAdmin();
  let body: { username?: unknown; password?: unknown; code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請輸入帳號與密碼" }, { status: 400 });
  }
  const user = String(body?.username || "").trim();
  const pass = String(body?.password || "");

  if (!user || !pass || user.length > 80 || pass.length > 200) {
    return NextResponse.json({ error: "請輸入帳號與密碼" }, { status: 400 });
  }

  const account = await prisma.portalAccount.findUnique({ where: { username: user } });
  if (!account?.passwordHash) {
    await bcrypt.compare(pass, DUMMY_PASSWORD_HASH);
    return denied();
  }

  const ok = await bcrypt.compare(pass, account.passwordHash);
  if (!ok || !account.isActive) return denied();

  const code = String(body?.code || "").replace(/\s/g, "");
  const needsTotp = account.role === "admin" || account.role === "user";

  if (needsTotp && account.totpEnabled) {
    if (!code) return NextResponse.json({ step: "code" });
    const totpOk = Boolean(account.totpSecret && portalTotpValid(account.username, account.totpSecret, code));
    if (!totpOk) {
      const saved = String(account.totpRecovery || "");
      let hashes: string[] = [];
      try {
        const parsed = JSON.parse(saved);
        hashes = Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
      } catch {
        hashes = [];
      }
      const hashed = hashRecoveryCode(code);
      if (!hashes.includes(hashed)) {
        const response = NextResponse.json({ error: "驗證碼錯誤" }, { status: 401 });
        response.headers.set("Cache-Control", "no-store");
        return response;
      }
      await prisma.portalAccount.update({
        where: { id: account.id },
        data: { totpRecovery: JSON.stringify(hashes.filter((item) => item !== hashed)) },
      });
    }
  }

  if (needsTotp && !account.totpEnabled) {
    const setup = await portalTotpSetup(account.username, account.totpSecret || undefined);
    let recoveryCodes: string[] = [];
    if (account.totpRecovery) {
      try {
        const parsed = JSON.parse(account.totpRecovery);
        recoveryCodes = Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
      } catch {
        recoveryCodes = [];
      }
    }
    if (!account.totpSecret || recoveryCodes.length === 0) {
      recoveryCodes = newRecoveryCodes();
      await prisma.portalAccount.update({
        where: { id: account.id },
        data: { totpSecret: setup.secret, totpRecovery: JSON.stringify(recoveryCodes) },
      });
    }
    if (!code || !portalTotpValid(account.username, setup.secret, code)) {
      const response = NextResponse.json(
        {
          ...(code ? { error: "驗證碼錯誤" } : {}),
          step: "setup",
          qrCodeUrl: setup.qrCodeUrl,
          secret: setup.secret,
          recoveryCodes,
        },
        { status: code ? 401 : 200 },
      );
      response.headers.set("Cache-Control", "no-store");
      return response;
    }
    await prisma.portalAccount.update({
      where: { id: account.id },
      data: {
        totpEnabled: true,
        totpRecovery: JSON.stringify(recoveryCodes.map((item) => hashRecoveryCode(item))),
      },
    });
  }

  const ip = getClientIp(request);
  const device = deviceFromRequest(request);
  await prisma.portalAccount.update({
    where: { id: account.id },
    data: {
      isOnline: true,
      loginCount: { increment: 1 },
      lastLoginAt: new Date(),
      lastActivityAt: new Date(),
      lastLoginIp: ip,
      lastDevice: device || null,
    },
  });

  await logOperation({
    accountId: account.id,
    username: account.displayName || account.username,
    role: account.role,
    action: "login",
    detail: "使用者登入",
    ipAddress: ip,
    device,
  });

  const session = await createPortalSession(account.id, account.username, account.role);
  const response = NextResponse.json({
    success: true,
    username: account.username,
    displayName: account.displayName || account.username,
    role: account.role,
    canAccessAdmin: account.role === "admin" || account.role === "user",
  });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Set-Cookie", portalCookieHeader(session));
  return response;
}
