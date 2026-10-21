import { cookies } from "next/headers";
import crypto from "crypto";

export const PORTAL_COOKIE = "portal_session";
const SESSION_MS = 8 * 60 * 60 * 1000;

export interface PortalSession {
  accountId: string;
  username: string;
  role: string;
  token: string;
  expiresAt: number;
  signature: string;
}

async function sign(data: string): Promise<string> {
  const secret = process.env.SESSION_SECRET || "";
  if (secret.length < 16) throw new Error("SESSION_SECRET 未設定");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createPortalSession(
  accountId: string,
  username: string,
  role: string,
): Promise<PortalSession> {
  const token = Date.now().toString(36) + Math.random().toString(36).slice(2);
  const expiresAt = Date.now() + SESSION_MS;
  const base = `${accountId}:${username}:${role}:${token}:${expiresAt}`;
  const signature = await sign(base);
  return { accountId, username, role, token, expiresAt, signature };
}

export async function verifyPortalSession(
  session: Omit<PortalSession, "signature"> & { signature: string },
): Promise<boolean> {
  const base = `${session.accountId}:${session.username}:${session.role}:${session.token}:${session.expiresAt}`;
  const expected = await sign(base);
  const left = Buffer.from(expected);
  const right = Buffer.from(session.signature);
  if (left.length === 0 || left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export async function getPortalSession(): Promise<PortalSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(PORTAL_COOKIE)?.value;
  if (!raw) return null;
  try {
    const session: PortalSession = JSON.parse(decodeURIComponent(raw));
    if (Date.now() > session.expiresAt) return null;
    if (!(await verifyPortalSession(session))) return null;
    return session;
  } catch {
    return null;
  }
}

function cookieFlags() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `HttpOnly${secure}; SameSite=Lax; Path=/`;
}

export function portalCookieHeader(session: PortalSession): string {
  return `${PORTAL_COOKIE}=${encodeURIComponent(JSON.stringify(session))}; ${cookieFlags()}; Max-Age=${SESSION_MS / 1000}`;
}

export function clearPortalCookieHeader(): string {
  return `${PORTAL_COOKIE}=; ${cookieFlags()}; Max-Age=0`;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}
