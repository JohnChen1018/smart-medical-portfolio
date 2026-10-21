import path from "node:path";

/** 專案內資料目錄，避免在程式碼寫死 Desktop 路徑（會拖慢 Turbopack 建置） */
export function lizardPatchImagesRoot() {
  return (
    process.env.LIZARD_PATCH_IMAGES_ROOT ??
    path.join(process.cwd(), "data", "lizard-patches")
  );
}

export function mpoxDatasetRoot() {
  return (
    process.env.MPOX_DATASET_ROOT ??
    path.join(process.cwd(), "data", "mpox-dataset")
  );
}

export function backupLocalRoot() {
  return (
    process.env.BACKUP_ROOT ??
    path.join(process.cwd(), "data", "backups", "local")
  );
}

export function backupCloudRoot() {
  return (
    process.env.BACKUP_CLOUD_DIR ??
    path.join(process.cwd(), "data", "backups", "cloud")
  );
}
