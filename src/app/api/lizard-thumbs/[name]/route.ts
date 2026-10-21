import { lizardPatchImagesRoot } from "@/lib/datasetPaths";
import { existsSync, mkdirSync, readFileSync, renameSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { NextResponse } from "next/server";

const CACHE = path.join(process.cwd(), "data", "lizard-thumbs");
const pending = new Map<string, Promise<string>>();
let active = 0;
const waiters: Array<() => void> = [];

function sourcePng(id: string) {
  const name = `conic_${id}.png`;
  const bundled = path.join(process.cwd(), "public", "lizard", name);
  if (existsSync(bundled)) return bundled;
  const external = path.join(lizardPatchImagesRoot(), name);
  if (existsSync(external)) return external;
  return "";
}

async function withSlot<T>(run: () => Promise<T>) {
  if (active >= 4) {
    await new Promise<void>((resolve) => waiters.push(resolve));
  }
  active += 1;
  try {
    return await run();
  } finally {
    active -= 1;
    waiters.shift()?.();
  }
}

async function ensureThumb(jpgName: string) {
  const dest = path.join(CACHE, jpgName);
  if (existsSync(dest)) return dest;
  const existing = pending.get(jpgName);
  if (existing) return existing;

  const id = jpgName.slice("conic_".length, -".jpg".length);
  const job = withSlot(async () => {
    if (existsSync(dest)) return dest;
    const src = sourcePng(id);
    if (!src) throw new Error("missing");
    mkdirSync(CACHE, { recursive: true });
    const part = `${dest}.${process.pid}.part`;
    await sharp(src).resize(160, 160, { fit: "cover" }).jpeg({ quality: 62 }).toFile(part);
    renameSync(part, dest);
    return dest;
  }).finally(() => {
    pending.delete(jpgName);
  });

  pending.set(jpgName, job);
  return job;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const name = (await params).name;
  if (!/^conic_\d{6}\.jpg$/i.test(name)) {
    return NextResponse.json({ error: "非法路徑" }, { status: 400 });
  }

  try {
    const file = await ensureThumb(name.toLowerCase());
    const body = readFileSync(file);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "找不到影像" }, { status: 404 });
  }
}
