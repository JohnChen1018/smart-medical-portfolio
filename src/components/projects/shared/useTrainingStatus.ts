"use client";

import { useEffect, useState } from "react";

export interface TrainingStatus {
  connected: boolean;
  machine: string;
  framework: string;
  currentConfig: string;
  run: number;
  totalRuns: number;
  epoch: number;
  totalEpochs: number;
  elapsedSeconds: number;
  status: string;
  note: string;
  updatedAt: string | null;
}

/** 輪詢本機 training_status.json，模擬分頁共用 */
export function useTrainingStatus(intervalMs = 5000) {
  const [status, setStatus] = useState<TrainingStatus | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/training-status", { cache: "no-store" });
        if (alive) setStatus(await res.json());
      } catch {
        /* ignore */
      }
    };
    load();
    const t = setInterval(load, intervalMs);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [intervalMs]);

  return status;
}
