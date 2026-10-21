import path from "node:path";
import Database from "better-sqlite3";
import { isPlainIp } from "@/lib/security";

const LOOPBACK = new Set(["127.0.0.1", "::1", "localhost", "0.0.0.0"]);

let cache: { at: number; ips: Set<string> } = { at: 0, ips: new Set() };

export function normalizeIp(raw: string) {
  let ip = raw.trim();
  if (ip.startsWith("::ffff:")) ip = ip.slice(7);
  if (ip.includes(".") && ip.includes(":")) {
    const last = ip.lastIndexOf(":");
    if (/^\d+$/.test(ip.slice(last + 1))) ip = ip.slice(0, last);
  }
  return ip;
}

export function isLoopbackIp(ip: string) {
  const value = ip.toLowerCase();
  return LOOPBACK.has(value) || value.startsWith("127.");
}

export function ipFromHeaders(getHeader: (name: string) => string | null) {
  const forwarded = getHeader("x-forwarded-for");
  const raw = forwarded?.split(",")[0] || getHeader("x-real-ip") || getHeader("cf-connecting-ip") || "";
  return normalizeIp(raw);
}

function databasePath() {
  const configured = process.env.DATABASE_URL || "file:./dev.db";
  const file = configured.replace(/^file:/, "");
  return path.isAbsolute(file) ? file : path.join(process.cwd(), file);
}

function readBlocked() {
  const db = new Database(databasePath(), { readonly: true, fileMustExist: true });
  try {
    const rows = db.prepare("SELECT ip FROM BlockedIp").all() as { ip: string }[];
    return new Set(rows.map((row) => row.ip));
  } finally {
    db.close();
  }
}

export function invalidateBlockCache() {
  cache.at = 0;
}

export function currentBlockedIps() {
  const now = Date.now();
  if (now - cache.at < 2000) return cache.ips;
  try {
    cache = { at: now, ips: readBlocked() };
  } catch {
    cache = { at: now, ips: cache.ips };
  }
  return cache.ips;
}

export function isBlockedIp(ip: string) {
  if (!ip || isLoopbackIp(ip) || !isPlainIp(ip)) return false;
  return currentBlockedIps().has(ip);
}

export function assertBlockableIp(ip: string) {
  if (!ip || !isPlainIp(ip)) return "請輸入有效的 IP";
  if (isLoopbackIp(ip)) return "不能封鎖這台電腦自己的位址";
  return "";
}
