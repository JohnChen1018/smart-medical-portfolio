"use client";

import { useMemo } from "react";
import { hyperparamsFromGrid } from "@/lib/wsiHyperparamGrid";
import { bestConfig, expFoldersFound, wsiConfigs, type WsiConfig } from "@/lib/wsiResults";
import type { ExpFolderEntry, GdriveExperiments } from "@/components/projects/wsi/GdriveExperimentsContext";
import type { WsiSupplementaryFields } from "@/lib/wsiDriveMetrics";

function pickSupplementary(
  base: Partial<WsiSupplementaryFields>,
  cloud: Partial<WsiSupplementaryFields>,
): WsiSupplementaryFields {
  const pickNum = (a?: number, b?: number) => {
    if (a != null && !Number.isNaN(a) && b != null && !Number.isNaN(b)) return Math.max(a, b);
    return a ?? b;
  };
  return {
    meanF1At5095: pickNum(base.meanF1At5095, cloud.meanF1At5095),
    tp: pickNum(base.tp, cloud.tp),
    fp: pickNum(base.fp, cloud.fp),
    fn: pickNum(base.fn, cloud.fn),
    mR2FullImage: pickNum(base.mR2FullImage, cloud.mR2FullImage),
    mMAEFullImage: cloud.mMAEFullImage ?? base.mMAEFullImage,
  };
}

export function useMergedWsiData(gdrive: GdriveExperiments | null) {
  return useMemo(() => {
    const cloudConfigs = gdrive?.wsiConfigs ?? [];
    const cloudFolders: ExpFolderEntry[] = gdrive?.expFoldersFound ?? expFoldersFound;
    const mergedConfigs = new Map<number, WsiConfig & { source?: string }>();
    wsiConfigs.forEach((c) => mergedConfigs.set(c.expId, c));
    cloudConfigs.forEach((c) => {
      const existing = mergedConfigs.get(c.expId);
      const base = existing ?? ({} as WsiConfig);
      const grid = hyperparamsFromGrid(c.expId);
      mergedConfigs.set(c.expId, {
        ...c,
        ...base,
        mPQ: Math.max(base.mPQ ?? 0, c.mPQ ?? 0),
        filterBase: base.filterBase || c.filterBase || grid?.filterBase || 0,
        convAfter: base.convAfter || c.convAfter || grid?.convAfter || 0,
        headBlocks: base.headBlocks || c.headBlocks || grid?.headBlocks || 0,
        lr: base.lr || c.lr || grid?.lr || 0,
        lossWeights:
          base.lossWeights && base.lossWeights !== "—" && base.lossWeights !== "NaN"
            ? base.lossWeights
            : c.lossWeights && c.lossWeights !== "NaN"
              ? c.lossWeights
              : grid?.lossWeights || base.lossWeights,
        confusion: base.confusion ?? c.confusion ?? null,
        maskPQ: Math.max(base.maskPQ ?? 0, c.maskPQ ?? 0) || base.maskPQ || c.maskPQ,
        maskDQ: Math.max(base.maskDQ ?? 0, c.maskDQ ?? 0) || base.maskDQ || c.maskDQ,
        maskSQ: Math.max(base.maskSQ ?? 0, c.maskSQ ?? 0) || base.maskSQ || c.maskSQ,
        precision: Math.max(base.precision ?? 0, c.precision ?? 0) || base.precision || c.precision,
        recall: Math.max(base.recall ?? 0, c.recall ?? 0) || base.recall || c.recall,
        f1: Math.max(base.f1 ?? 0, c.f1 ?? 0) || base.f1 || c.f1,
        map50Segm: Math.max(base.map50Segm ?? 0, c.map50Segm ?? 0) || base.map50Segm || c.map50Segm,
        map50Bbox: Math.max(base.map50Bbox ?? 0, c.map50Bbox ?? 0) || base.map50Bbox || c.map50Bbox,
        pqNeu: (c as WsiConfig).pqNeu || base.pqNeu || 0,
        pqEpi: (c as WsiConfig).pqEpi || base.pqEpi || 0,
        pqLym: (c as WsiConfig).pqLym || base.pqLym || 0,
        pqPls: (c as WsiConfig).pqPls || base.pqPls || 0,
        pqEos: (c as WsiConfig).pqEos || base.pqEos || 0,
        pqCon: (c as WsiConfig).pqCon || base.pqCon || 0,
        ...pickSupplementary(base as WsiSupplementaryFields, c as WsiSupplementaryFields),
      });
    });
    mergedConfigs.forEach((cfg, expId) => {
      const grid = hyperparamsFromGrid(expId);
      if (!grid) return;
      mergedConfigs.set(expId, {
        ...cfg,
        filterBase: cfg.filterBase || grid.filterBase,
        convAfter: cfg.convAfter || grid.convAfter,
        headBlocks: cfg.headBlocks || grid.headBlocks,
        lr: cfg.lr || grid.lr,
        lossWeights:
          cfg.lossWeights && cfg.lossWeights !== "—" && cfg.lossWeights !== "NaN"
            ? cfg.lossWeights
            : grid.lossWeights,
      });
    });
    const folderByExp = new Map<number, ExpFolderEntry[]>();
    cloudFolders.forEach((f) => {
      const list = folderByExp.get(f.expId) ?? [];
      list.push(f);
      folderByExp.set(f.expId, list);
    });
    const bestFromCloud = gdrive?.bestConfig;
    const rawBest =
      bestFromCloud && bestFromCloud.mPQ > bestConfig.mPQ ? bestFromCloud : bestConfig;
    const effectiveBest = mergedConfigs.get(rawBest.expId) ?? rawBest;
    return { cloudConfigs, cloudFolders, mergedConfigs, folderByExp, effectiveBest };
  }, [gdrive]);
}
