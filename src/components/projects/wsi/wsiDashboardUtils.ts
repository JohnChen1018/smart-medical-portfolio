import { wsiConfigs, type ConfusionMatrix, type WsiConfig } from "@/lib/wsiResults";
import type { ExpFolderEntry } from "@/components/projects/wsi/GdriveExperimentsContext";
import { getRootDriveFolderId } from "@/lib/wsiRootExperiments";

export function hpDisplay(v: number | string | undefined | null) {
  if (v == null || v === 0 || v === "—" || v === "" || v === "NaN" || v === "nan") return "—";
  if (typeof v === "number" && Number.isNaN(v)) return "—";
  return String(v);
}

export function localConfusionForExp(expId: number): ConfusionMatrix | null {
  return wsiConfigs.find((c) => c.expId === expId)?.confusion ?? null;
}

export function hpSummary(cfg: WsiConfig) {
  const loss = hpDisplay(cfg.lossWeights);
  const parts = [
    cfg.filterBase ? `filter=${hpDisplay(cfg.filterBase)}` : "",
    cfg.convAfter ? `conv=${hpDisplay(cfg.convAfter)}` : "",
    cfg.headBlocks ? `head=${hpDisplay(cfg.headBlocks)}` : "",
    cfg.lr ? `lr=${hpDisplay(cfg.lr)}` : "",
    loss !== "—" ? `loss=${loss}` : "",
  ].filter(Boolean);
  if (parts.length) return parts.join(" · ");
  return "調整：unet_n_filter_base · net_conv_after_unet · head_blocks · train_learning_rate · train_loss_weights";
}


export function pickDriveFolderId(
  expId: number,
  cfg: (WsiConfig & { source?: string }) | undefined,
  folders: ExpFolderEntry[] | undefined,
): string | undefined {
  if (cfg?.studentFolder && folders?.length) {
    const match = folders.find((f) => f.studentFolder === cfg.studentFolder);
    if (match?.driveFolderId) return match.driveFolderId;
  }
  const fromFolders = folders?.find((f) => f.driveFolderId)?.driveFolderId;
  if (fromFolders) return fromFolders;
  return getRootDriveFolderId(expId);
}
