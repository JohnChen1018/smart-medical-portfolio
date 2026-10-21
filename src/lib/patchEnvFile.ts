import fs from "node:fs";
import path from "node:path";

const ENV_PATH = path.join(process.cwd(), ".env");

const AI_KEY_VARS = [
  "CURSOR_API_KEY",
  "OPENAI_API_KEY",
  "GEMINI_API_KEY",
] as const;

function escapeEnvValue(value: string) {
  if (/[\s#"']/.test(value)) return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  return value;
}

function upsertLine(content: string, key: string, value: string) {
  const line = `${key}=${escapeEnvValue(value)}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(content)) return content.replace(re, line);
  const trimmed = content.replace(/\s+$/, "");
  const prefix = trimmed.length ? `${trimmed}\n` : "";
  return `${prefix}${line}\n`;
}

/** 更新 .env 中的 AI 金鑰（僅覆寫有提供的欄位） */
export function patchAiEnvKeys(updates: Partial<Record<(typeof AI_KEY_VARS)[number], string>>) {
  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf8") : "";

  if (!content.includes("CURSOR_API_KEY") && !content.includes("# AI 建議")) {
    content = `${content.replace(/\s+$/, "")}\n\n# AI 建議（分析頁）\nCURSOR_API_KEY=\nOPENAI_API_KEY=\nGEMINI_API_KEY=\nGEMINI_MODEL=gemini-2.0-flash\nOPENAI_MODEL=gpt-4o-mini\nCURSOR_MODEL=composer-2.5\n`;
  }

  for (const key of AI_KEY_VARS) {
    const value = updates[key]?.trim();
    if (value) content = upsertLine(content, key, value);
  }

  fs.writeFileSync(ENV_PATH, content.endsWith("\n") ? content : `${content}\n`, "utf8");

  for (const key of AI_KEY_VARS) {
    const value = updates[key]?.trim();
    if (value) process.env[key] = value;
  }
}

/** 讀取 .env 中已永久儲存的 AI 金鑰（不回傳明文） */
export function listPersistedAiKeys(): Record<(typeof AI_KEY_VARS)[number], boolean> {
  let content = "";
  if (fs.existsSync(ENV_PATH)) content = fs.readFileSync(ENV_PATH, "utf8");
  const has = (key: string) => {
    const m = content.match(new RegExp(`^${key}=(.*)$`, "m"));
    if (!m) return false;
    const v = m[1].replace(/^["']|["']$/g, "").trim();
    return Boolean(v);
  };
  return {
    CURSOR_API_KEY: has("CURSOR_API_KEY"),
    OPENAI_API_KEY: has("OPENAI_API_KEY"),
    GEMINI_API_KEY: has("GEMINI_API_KEY"),
  };
}
