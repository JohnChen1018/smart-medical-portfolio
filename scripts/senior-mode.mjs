#!/usr/bin/env node
/**
 * Senior mode: http://PUBLIC_IP:8080 (like 163.17.21.25:8080)
 */
import { createRequire } from "node:module";
import { spawn, execSync } from "node:child_process";
import { writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_PORT = 8080;
const APP_PORT = 3000;

async function getPublicIp() {
  try {
    const res = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    return data.ip;
  } catch {
    return null;
  }
}

function getLanIp() {
  try {
    const out = execSync(
      `powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Sort-Object InterfaceMetric | Select-Object -First 1).IPAddress"`,
      { encoding: "utf8" },
    ).trim();
    return out || "192.168.0.103";
  } catch {
    return "192.168.0.103";
  }
}

async function waitForApp(port) {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return port;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return null;
}

function isPort8080Free() {
  try {
    const out = execSync('netstat -ano | findstr "LISTENING" | findstr ":8080 "', { encoding: "utf8" });
    return !out.trim();
  } catch {
    return true;
  }
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

function saveUrls(homeUrl, wsiUrl, extra = "") {
  const body = [
    "學長模式 — 複製貼上給別人即可",
    "",
    `首頁：${homeUrl}`,
    `WSI： ${wsiUrl}`,
    "",
    `建立：${new Date().toLocaleString("zh-TW")}`,
    extra,
    "",
    "請保持「學長模式.bat」與網站視窗開啟。",
  ]
    .filter(Boolean)
    .join("\n");

  writeFileSync(join(root, "公開網址.txt"), body, "utf8");
  try {
    writeFileSync(
      join(process.env.USERPROFILE || "", "Desktop", "作品集公開網址.txt"),
      body,
      "utf8",
    );
  } catch {
    /* ignore */
  }
}

function isPrivateIp(ip) {
  if (!ip) return true;
  return /^(10\.|127\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(ip);
}

async function tryUpnp(internalPort) {
  try {
    const natUpnp = require("nat-upnp");
    const client = natUpnp.createClient();

    const externalIp = await new Promise((resolve) => {
      client.externalIp((err, ip) => resolve(err ? null : ip));
    });

    await new Promise((resolve, reject) => {
      client.portMapping(
        {
          public: PUBLIC_PORT,
          private: internalPort,
          description: "MedicalPortfolio",
          ttl: 0,
        },
        (err) => (err ? reject(err) : resolve()),
      );
    });

    return { ok: true, externalIp };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function main() {
  console.log("\n========================================");
  console.log("  學長模式  http://公網IP:8080");
  console.log("========================================\n");

  let appPort = APP_PORT;
  const free8080 = isPort8080Free();

  if (free8080) {
    console.log("port 8080 可用，改以 8080 啟動網站（與學長相同）...");
    const node = "C:\\Program Files\\nodejs\\npm.cmd";
    if (existsSync(node)) {
      spawn("cmd", ["/c", "npm.cmd run start:public"], {
        cwd: root,
        detached: true,
        stdio: "ignore",
        windowsHide: true,
        env: { ...process.env, Path: `C:\\Program Files\\nodejs;${process.env.Path || ""}` },
      }).unref();
      appPort = PUBLIC_PORT;
      await new Promise((r) => setTimeout(r, 8000));
    }
  } else {
    console.log("port 8080 已被其他程式使用，網站維持在 3000，");
    console.log("將嘗試路由器把「外網 8080」轉到「內網 3000」。\n");
  }

  const ready = await waitForApp(appPort);
  if (!ready) {
    console.error("網站未啟動。請先執行 npm run build && npm run start\n");
    process.exit(1);
  }

  console.log(`網站已就緒：port ${appPort}\n`);

  const publicIp = await getPublicIp();
  const lanIp = getLanIp();
  const upnp = await tryUpnp(appPort);

  const ip =
    publicIp && !isPrivateIp(publicIp)
      ? publicIp
      : upnp.externalIp && !isPrivateIp(upnp.externalIp)
        ? upnp.externalIp
        : publicIp || lanIp;
  const homeUrl = `http://${ip}:${PUBLIC_PORT}`;
  const wsiUrl = `${homeUrl}/projects/whole-slide-object-detection`;

  let note = "";
  if (upnp.ok) {
    note = "路由器 UPnP 已自動設定端口轉發。";
    console.log("[OK] 路由器已自動設定：外網 8080 -> 內網 " + appPort);
  } else {
    note = [
      "路由器需手動設定（若 4G 連不上）：",
      `  外網 port ${PUBLIC_PORT} -> ${lanIp}:${appPort} (TCP)`,
      `  登入路由器：http://192.168.0.1 或 http://192.168.1.1`,
    ].join("\n");
    console.log("[!] 無法自動設定路由器（UPnP 未開啟或路由器不支援）");
    console.log(`    請手動轉發：外網 ${PUBLIC_PORT} -> ${lanIp}:${appPort}\n`);
  }

  copyClipboard(homeUrl);
  saveUrls(homeUrl, wsiUrl, note);

  console.log("========================================");
  console.log("  分享這個網址（已複製到剪貼簿）");
  console.log("========================================\n");
  console.log(`  ${homeUrl}\n`);
  console.log(`  WSI：${wsiUrl}\n`);
  console.log(`  同 Wi-Fi：http://${lanIp}:${appPort === PUBLIC_PORT ? PUBLIC_PORT : appPort}\n`);
  if (!upnp.ok) console.log(note + "\n");
  console.log("請保持此視窗與網站執行中。\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
