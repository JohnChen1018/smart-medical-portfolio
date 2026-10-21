import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { isDirectLocalRequest, localOnlyResponse } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);
let captureBusy = false;

export async function GET(request: Request) {
  if (!isDirectLocalRequest(request)) return localOnlyResponse();
  if (captureBusy) return new NextResponse(null, { status: 404 });
  captureBusy = true;
  const out = path.join(os.tmpdir(), `qupath-frame-${Date.now()}-${Math.random().toString(16).slice(2)}.jpg`);
  const script = path.join(process.cwd(), "scripts", "qupath-frame.ps1");
  try {
    await execFileAsync(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script, "-OutFile", out],
      { windowsHide: true, timeout: 8000 },
    );
    const body = await fs.readFile(out);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  } finally {
    captureBusy = false;
    await fs.unlink(out).catch(() => undefined);
  }
}
