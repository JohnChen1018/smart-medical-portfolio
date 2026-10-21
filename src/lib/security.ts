import { NextResponse } from "next/server";
import path from "node:path";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function isLoopbackHost(value: string) {
  const host = value.toLowerCase().replace(/^\[|\]$/g, "");
  const name = host.split(":")[0];
  return name === "127.0.0.1" || name === "localhost" || name === "::1";
}

/** 只認打到本機網址的請求。外網隧道的來源位址不是本機，不放行。 */
export function isDirectLocalRequest(request: Request) {
  const host = request.headers.get("host") || "";
  if (!isLoopbackHost(host)) return false;
  const forwarded = [
    request.headers.get("x-forwarded-for") || "",
    request.headers.get("x-real-ip") || "",
    request.headers.get("cf-connecting-ip") || "",
  ]
    .join(",")
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return forwarded.every((ip) => isLoopbackHost(ip));
}

export function localOnlyResponse() {
  return NextResponse.json({ ok: false, error: "只允許這台電腦使用" }, { status: 403 });
}

export function clientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const raw = (forwarded?.split(",")[0] || request.headers.get("x-real-ip") || "local").trim();
  return raw.slice(0, 80) || "local";
}

export function isPlainIp(value: string) {
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(value) || /^[0-9a-f:]{2,45}$/i.test(value);
}

/** 同一鍵在時間窗內超過次數就拒絕。 */
export function allowRequest(key: string, max: number, windowMs: number) {
  const now = Date.now();
  if (buckets.size > 400) {
    for (const [bucketKey, bucket] of buckets) {
      if (now > bucket.resetAt) buckets.delete(bucketKey);
    }
  }
  const current = buckets.get(key);
  if (!current || now > current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= max) return false;
  current.count += 1;
  return true;
}

export function tooManyResponse() {
  return NextResponse.json({ ok: false, error: "嘗試太多次，請稍後再試" }, { status: 429 });
}

/** 確認最終路徑仍在指定資料夾內。 */
export function isInsideDir(root: string, target: string) {
  const base = path.resolve(root);
  const resolved = path.resolve(target);
  const rel = path.relative(base, resolved);
  return rel.length > 0 && !rel.startsWith("..") && !path.isAbsolute(rel);
}
