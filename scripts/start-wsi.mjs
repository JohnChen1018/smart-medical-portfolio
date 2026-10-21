import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env");
const HOST = "127.0.0.1";
const PORT = "3002";

const AI_VARS = ["GEMINI_API_KEY", "OPENAI_API_KEY", "CURSOR_API_KEY"];

function readEnvValue(text, key) {
  const m = text.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!m) return "";
  return m[1].replace(/^["']|["']$/g, "").replace(/\r$/, "").trim();
}

function persistedKeys() {
  if (!fs.existsSync(envPath)) return [];
  const text = fs.readFileSync(envPath, "utf8");
  return AI_VARS.filter((k) => readEnvValue(text, k));
}

function freePort() {
  try {
    execSync(
      `powershell -NoProfile -Command "$p=Get-NetTCPConnection -LocalPort ${PORT} -ErrorAction SilentlyContinue|Select -Expand OwningProcess -Unique; if($p){$p|%{Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue}}"`,
      { stdio: "ignore" },
    );
  } catch {
    /* port may already be free */
  }
}

const keys = persistedKeys();
freePort();

console.log("");
console.log("  WSI 儀表板 → http://" + HOST + ":" + PORT + "/projects/whole-slide-object-detection");
console.log("  AI 金鑰：從 .env 自動載入（永久儲存，重啟不用再貼）");
console.log("  已設定：" + (keys.length ? keys.join("、") : "（尚無，請至 /admin/tokens 設定一次即可）"));
console.log("");

const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
// 開發模式：改程式後重整即可看到，不必每次 next build
const child = spawn(process.execPath, [nextBin, "dev", "--webpack", "-H", HOST, "-p", PORT], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));
