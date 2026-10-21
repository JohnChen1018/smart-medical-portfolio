import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

const STALE_MS = 5 * 60 * 1000;

const DEFAULT_STATUS = {
  connected: false,
  machine: "尚未回報",
  framework: "TensorFlow/Keras",
  currentConfig: "-",
  run: 0,
  totalRuns: 10,
  epoch: 0,
  totalEpochs: 50,
  elapsedSeconds: 0,
  status: "idle",
  note: "目前沒有訓練在跑；開始訓練後，腳本會寫入 data/training_status.json 並顯示即時進度。",
  updatedAt: null as string | null,
};

function normalizeStatus(data: Record<string, unknown>) {
  const merged = { ...DEFAULT_STATUS, ...data };
  const updatedAt = merged.updatedAt ? new Date(String(merged.updatedAt)).getTime() : NaN;
  const hasHeartbeat = Number.isFinite(updatedAt);
  const isStale = !hasHeartbeat || Date.now() - updatedAt > STALE_MS;
  const explicitConnected = Boolean(merged.connected);

  // 只有訓練腳本寫入、且未逾時，才視為「監控已連線」
  const connected = explicitConnected && hasHeartbeat && !isStale;

  if (merged.status === "running" && isStale) {
    return {
      ...DEFAULT_STATUS,
      connected: false,
      note: "上次訓練狀態已逾時，目前視為未在訓練（仍讀 training_status.json，非直接連 VS Code）。",
    };
  }

  if (merged.status === "running" && connected) {
    return { ...merged, connected: true };
  }

  return {
    ...merged,
    connected,
    status: "idle",
    currentConfig: "-",
    run: 0,
    epoch: 0,
    elapsedSeconds: 0,
    machine: connected ? "監控已連線" : "尚未回報",
    note:
      merged.note ||
      (connected
        ? "監控已連線；目前沒有訓練在跑。有訓練時腳本會寫入 data/training_status.json。"
        : DEFAULT_STATUS.note),
  };
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "training_status.json");
    const raw = await readFile(filePath, "utf8");
    const data = JSON.parse(raw);
    return NextResponse.json(normalizeStatus(data));
  } catch {
    return NextResponse.json(DEFAULT_STATUS);
  }
}
