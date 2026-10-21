import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ipFromHeaders, isBlockedIp } from "@/lib/ip-block";

const ADMIN_COOKIE = "admin_session";
const PORTAL_COOKIE = "portal_session";
const OPEN_PATHS = new Set(["/api/portal/login", "/api/portal/session", "/api/portal/logout"]);

type SessionShape = {
  userId?: string;
  accountId?: string;
  username?: string;
  role?: string;
  token: string;
  expiresAt: number;
  signature: string;
};

function parseSessionCookie(value: string): SessionShape | null {
  try {
    return JSON.parse(decodeURIComponent(value));
  } catch {
    return null;
  }
}

async function sign(secret: string, data: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function blockedResponse(pathname: string) {
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "這個位址已封鎖" }, { status: 403 });
  }
  const html = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>無法瀏覽</title></head><body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0B0F14;color:#E6EDF3;font-family:sans-serif"><main style="padding:24px"><h1 style="font-size:28px">這個位址已封鎖</h1><p>目前無法瀏覽這個網站。</p></main></body></html>`;
  return new NextResponse(html, {
    status: 403,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

function skipsBlock(pathname: string) {
  if (OPEN_PATHS.has(pathname)) return true;
  return pathname.startsWith("/admin") || pathname.startsWith("/jasladmin") || pathname.startsWith("/api/admin");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/_next") || pathname.includes(".")) return NextResponse.next();

  if (!skipsBlock(pathname)) {
    const ip = ipFromHeaders((name) => request.headers.get(name));
    if (isBlockedIp(ip)) return blockedResponse(pathname);
  }

  if (pathname.startsWith("/admin")) {
    const raw = request.cookies.get(PORTAL_COOKIE)?.value;
    if (!raw) return NextResponse.redirect(new URL("/", request.url));
    const session = parseSessionCookie(raw);
    if (!session || Date.now() > session.expiresAt) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    const secret = process.env.SESSION_SECRET;
    const expected = secret && session.accountId && session.username && session.role
      ? await sign(secret, `${session.accountId}:${session.username}:${session.role}:${session.token}:${session.expiresAt}`)
      : "";
    if (expected !== session.signature || (session.role !== "admin" && session.role !== "user")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/jasladmin/login") return NextResponse.next();

  if (pathname.startsWith("/jasladmin/")) {
    const raw = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!raw) return NextResponse.redirect(new URL("/jasladmin/login", request.url));
    const session = parseSessionCookie(raw);
    if (!session || Date.now() > session.expiresAt) {
      return NextResponse.redirect(new URL("/jasladmin/login", request.url));
    }
    const secret = process.env.SESSION_SECRET;
    const expected = secret && session.userId
      ? await sign(secret, `${session.userId}:${session.token}:${session.expiresAt}`)
      : "";
    if (expected !== session.signature) {
      return NextResponse.redirect(new URL("/jasladmin/login", request.url));
    }
  }

  return NextResponse.next();
}
