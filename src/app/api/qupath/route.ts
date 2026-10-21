import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import { NextResponse } from "next/server";
import { isDirectLocalRequest, localOnlyResponse } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QUPATH_EXE =
  process.env.QUPATH_EXE ||
  "C:\\Users\\John\\AppData\\Local\\QuPath-0.6.0\\QuPath-0.6.0.exe";

function installed() {
  return fs.existsSync(QUPATH_EXE);
}

function running() {
  if (process.platform !== "win32") return false;
  try {
    const out = execFileSync("tasklist", ["/FI", "IMAGENAME eq QuPath-0.6.0.exe", "/NH"], {
      encoding: "utf8",
      windowsHide: true,
    });
    return out.toLowerCase().includes("qupath-0.6.0.exe");
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  if (!isDirectLocalRequest(request)) return localOnlyResponse();
  return NextResponse.json({
    ok: true,
    installed: installed(),
    running: running(),
  });
}

export async function POST(request: Request) {
  if (!isDirectLocalRequest(request)) return localOnlyResponse();
  if (!installed()) {
    return NextResponse.json({ ok: false, error: "這台電腦找不到 QuPath" }, { status: 404 });
  }
  if (!running()) {
    const child = spawn(QUPATH_EXE, [], {
      detached: true,
      stdio: "ignore",
      windowsHide: false,
    });
    child.unref();
  }
  return NextResponse.json({ ok: true, installed: true, running: true });
}
