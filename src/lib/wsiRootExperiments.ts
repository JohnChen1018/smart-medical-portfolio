/** Google Drive「lizard 最佳超參數」根目錄 */
export const wsiLizardRootFolderId =
  process.env.GOOGLE_DRIVE_WSI_ROOT_FOLDER_ID ?? "1k3oCXPchJL6IRj_5vAb5BBivjHt10gZZ";

/** 雲端根目錄的 StarDist 專案資料夾 → 網站 exp_49 / exp_50 */
export const wsiRootDriveExperiments = [
  {
    expId: 49,
    expFolder: "exp_49",
    studentFolder: "StarDist Exp451",
    label: "LeakyReLU Exp451",
    rootFolderId: "1PML17wvVy2r0sA4hDETYXcp54K8XXUs5",
    driveName:
      "StarDist_6class_outputs_CoNIC_RandomPatch_80_10_10_NoOversampling_48configs_10runs_LeakyReLU_Exp451",
    summaryChartFile: "exp451_train_val_test_full_mpq_loss_three_panels.png",
    summaryChartRootId: wsiLizardRootFolderId,
    run1SummaryChart: true,
  },
  {
    expId: 50,
    expFolder: "exp_50",
    studentFolder: "StarDist Exp450",
    label: "MicroLossTune Exp450",
    rootFolderId: "1a9MpAKVBa3bSp5Bvq0nXUF7ujoeXWyUw",
    driveName:
      "StarDist_6class_outputs_CoNIC_RandomPatch_80_10_10_NoOversampling_48configs_10runs_MicroLossTune_Exp450",
    run1SummaryChart: false,
  },
] as const;

export function getRootDriveFolderId(expId: number): string | undefined {
  return wsiRootDriveExperiments.find((e) => e.expId === expId)?.rootFolderId;
}

export const totalConfigsPlanned = 50;

/** 模擬列表順序：exp_49 與 exp_50 對調顯示 */
export function simulationExpOrder(total = totalConfigsPlanned): number[] {
  const ids = Array.from({ length: total }, (_, i) => i + 1);
  if (total >= 50) {
    ids[48] = 50;
    ids[49] = 49;
  }
  return ids;
}

export function getRootExperimentMeta(expId: number) {
  return wsiRootDriveExperiments.find((e) => e.expId === expId);
}
