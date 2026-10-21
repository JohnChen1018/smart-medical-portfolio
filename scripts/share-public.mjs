#!/usr/bin/env node
/**
 * One-click public URL — copy/paste for others, no firewall/router/tunnel password.
 * Usage: node scripts/share-public.mjs
 */
import { spawn } from "node:child_process";
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cloudflared = join(root, "scripts", "cloudflared.exe");
const urlFile = join(root, "公開網址.txt");
const desktopFile = join(
  process.env.USERPROFILE || "",
  "Desktop",
  "作品集公開網址.txt",
);

async function waitForServer() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch("http://127.0.0.1:3000/", { signal: AbortSignal.timeout(2000) });
      if (res.ok) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

function copyClipboard(text) {
  try {
    const safe = text.replace(/'/g, "''");
    execSync(`powershell -NoProfile -Command "Set-Clipboard -Value '${safe}'"`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function saveUrl(baseUrl) {
  const wsi = `${baseUrl}/projects/whole-slide-object-detection`;
  const body = [
    "作品集公開網址（複製貼上給別人即可）",
    "",
    `首頁：${baseUrl}`,
    `WSI： ${wsi}`,
    "",
    `建立時間：${new Date().toLocaleString("zh-TW")}`,
    "",
    "注意：請保持「分享網址.bat」視窗開啟，關掉後網址會失效。",
  ].join("\n");
  writeFileSync(urlFile, body, "utf8");
  try {
    writeFileSync(desktopFile, body, "utf8");
  } catch {
    /* ignore */
  }
}

async function main() {
  if (!existsSync(cloudflared)) {
    console.error("\n找不到 cloudflared.exe，請重新執行「分享網址.bat」。\n");
    process.exit(1);
  }

  console.log("\n正在檢查本機網站 (port 3000)...");
  const up = await waitForServer();
  if (!up) {
    console.error("\n網站尚未啟動。請先執行「分享網址.bat」（會自動啟動），或手動 npm run start\n");
    process.exit(1);
  }

  console.log("正在建立公開網址（約 5～15 秒）...\n");

  const child = spawn(cloudflared, ["tunnel", "--url", "http://127.0.0.1:3000"], {
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  let done = false;
  const onLine = (chunk) => {
    const text = chunk.toString();
    const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
    if (match && !done) {
      done = true;
      const base = match[0].replace(/\/$/, "");
      const wsi = `${base}/projects/whole-slide-object-detection`;
      saveUrl(base);
      copyClipboard(base);

      console.log("========================================");
      console.log("  複製下面網址給別人即可（已複製到剪貼簿）");
      console.log("========================================\n");
      console.log(`  ${base}\n`);
      console.log(`  WSI：${wsi}\n`);
      console.log("  也存於：公開網址.txt、桌面「作品集公開網址.txt」");
      console.log("\n  請保持此視窗開啟。關閉 = 別人連不上。\n");
    }
    if (!done && /error|failed/i.test(text)) {
      process.stderr.write(text);
    }
  };

  child.stdout.on("data", onLine);
  child.stderr.on("data", onLine);
  child.on("exit", (code) => {
    if (!done) {
      console.error(`\n隧道結束 (code ${code ?? "?"})\n`);
      process.exit(code ?? 1);
    }
  });

  process.on("SIGINT", () => child.kill());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
