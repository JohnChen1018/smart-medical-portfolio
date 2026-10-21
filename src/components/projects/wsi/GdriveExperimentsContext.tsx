"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { WsiConfig } from "@/lib/wsiResults";

export interface ExpFolderEntry {
  studentFolder: string;
  expId: number;
  expFolder: string;
  driveFolderId?: string;
  hasSummary?: boolean;
}

export interface GdriveExperiments {
  connected: boolean;
  error?: string;
  mode?: string;
  expFoldersFound: ExpFolderEntry[];
  wsiConfigs: (WsiConfig & { source?: string })[];
  bestConfig: WsiConfig | null;
}

const GdriveCtx = createContext<GdriveExperiments | null>(null);

/** 全儀表板只 fetch 一次 Google Drive 實驗資料（每 60 秒更新） */
export function GdriveExperimentsProvider({ children }: { children: ReactNode }) {
  const [gdrive, setGdrive] = useState<GdriveExperiments | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/gdrive/experiments");
        if (alive) setGdrive(await res.json());
      } catch {
        /* ignore */
      }
    };
    load();
    const t = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return <GdriveCtx.Provider value={gdrive}>{children}</GdriveCtx.Provider>;
}

export function useGdriveExperiments() {
  return useContext(GdriveCtx);
}
