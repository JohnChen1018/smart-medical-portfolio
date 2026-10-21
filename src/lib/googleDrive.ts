const DRIVE_API = "https://www.googleapis.com/drive/v3";
const CACHE_MS = 24 * 60 * 60 * 1000;

const folderCache = new Map<string, { at: number; files: DriveFile[] }>();
const trainingCurveCache = new Map<string, { at: number; fileId: string; run: string }>();
const driveImageCache = new Map<string, { at: number; fileId: string }>();

function cacheGet<T extends { at: number }>(map: Map<string, T>, key: string): T | null {
  const hit = map.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_MS) {
    map.delete(key);
    return null;
  }
  return hit;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
}

function getApiKey() {
  return process.env.GOOGLE_DRIVE_API_KEY ?? "";
}

export function getWsiRootFolderId() {
  return process.env.GOOGLE_DRIVE_WSI_ROOT_FOLDER_ID ?? "1k3oCXPchJL6IRj_5vAb5BBivjHt10gZZ";
}

export function usesDriveApiKey() {
  return Boolean(getApiKey());
}

/** 公開分享資料夾：解析 embeddedfolderview（不需 API 金鑰） */
async function listPublicFolder(folderId: string): Promise<DriveFile[]> {
  const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${folderId}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`無法讀取公開資料夾 (${res.status})`);

  const html = await res.text();
  const files: DriveFile[] = [];
  for (const m of html.matchAll(/id="entry-([^"]+)"[\s\S]*?flip-entry-title">([^<]+)/g)) {
    const name = m[2].trim();
    const isFolder = html.includes(`entry-${m[1]}`) && html.includes("drive-sprite-folder");
    files.push({
      id: m[1],
      name,
      mimeType: isFolder ? "application/vnd.google-apps.folder" : "application/octet-stream",
    });
  }

  // 重新標記資料夾：flip-entry 區塊內含 folder sprite
  for (const file of files) {
    const block = html.match(new RegExp(`id="entry-${file.id}"[\\s\\S]*?(?=id="entry-|$)`));
    if (block && /folder-list-shared|folder-grid-shared|drive-sprite-folder/.test(block[0])) {
      file.mimeType = "application/vnd.google-apps.folder";
    }
  }

  return files;
}

async function listDriveFolderApi(folderId: string): Promise<DriveFile[]> {
  const apiKey = getApiKey();
  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(`${DRIVE_API}/files`);
    url.searchParams.set("q", `'${folderId}' in parents and trashed=false`);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("fields", "nextPageToken,files(id,name,mimeType,modifiedTime)");
    url.searchParams.set("pageSize", "1000");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Google Drive API 錯誤 (${res.status}): ${body.slice(0, 200)}`);
    }

    const data = (await res.json()) as { files?: DriveFile[]; nextPageToken?: string };
    files.push(...(data.files ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return files;
}

export async function listDriveFolder(folderId: string): Promise<DriveFile[]> {
  const cached = cacheGet(folderCache, folderId);
  if (cached) return cached.files;
  const files = getApiKey() ? await listDriveFolderApi(folderId) : await listPublicFolder(folderId);
  folderCache.set(folderId, { at: Date.now(), files });
  return files;
}

async function downloadPublicText(fileId: string): Promise<string> {
  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    redirect: "follow",
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`無法下載公開檔案 ${fileId} (${res.status})`);
  const text = await res.text();
  if (text.includes("<!DOCTYPE html") && text.includes("Google Drive")) {
    throw new Error("檔案需登入或無法公開下載");
  }
  return text;
}

export async function downloadDriveText(fileId: string): Promise<string> {
  if (getApiKey()) {
    const url = `${DRIVE_API}/files/${fileId}?alt=media&key=${getApiKey()}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`無法下載 Drive 檔案 ${fileId} (${res.status})`);
    return res.text();
  }
  return downloadPublicText(fileId);
}

export async function downloadDriveBinary(fileId: string): Promise<{ data: ArrayBuffer; contentType: string }> {
  const fetchBinary = async (url: string) => {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "follow",
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`無法下載 Drive 檔案 ${fileId} (${res.status})`);
    const data = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    if (contentType.includes("text/html")) {
      throw new Error("檔案需登入或無法公開下載");
    }
    return { data, contentType };
  };

  if (getApiKey()) {
    return fetchBinary(`${DRIVE_API}/files/${fileId}?alt=media&key=${getApiKey()}`);
  }
  return fetchBinary(`https://drive.google.com/uc?export=download&id=${fileId}`);
}

export async function findFileByName(parentId: string, name: string): Promise<DriveFile | null> {
  const children = await listDriveFolder(parentId);
  return children.find((f) => f.name === name) ?? null;
}

export async function findChildFolder(parentId: string, name: string): Promise<DriveFile | null> {
  const children = await listDriveFolder(parentId);
  return children.find((f) => f.mimeType === "application/vnd.google-apps.folder" && f.name === name) ?? null;
}

function isFolder(entry: DriveFile) {
  return entry.mimeType === "application/vnd.google-apps.folder";
}

async function sortedRunFolders(parentId: string) {
  const top = await listDriveFolder(parentId);
  return top
    .filter((f) => isFolder(f) && /^run\d+$/i.test(f.name))
    .sort((a, b) => {
      const na = parseInt(a.name.replace(/\D/g, ""), 10);
      const nb = parseInt(b.name.replace(/\D/g, ""), 10);
      return na - nb;
    });
}

export async function listTrainingRunNames(expFolderId: string): Promise<string[]> {
  const runFolders = await sortedRunFolders(expFolderId);
  return runFolders.map((r) => r.name);
}

export async function findTrainingCurveForRun(
  expFolderId: string,
  runName: string,
): Promise<string | null> {
  const cacheKey = `${expFolderId}:${runName}`;
  const cached = cacheGet(trainingCurveCache, cacheKey);
  if (cached) return cached.fileId;

  const runFolder = await findChildFolder(expFolderId, runName);
  if (!runFolder) return null;
  const png = await findFileByName(runFolder.id, "training_curve.png");
  if (png?.id) {
    trainingCurveCache.set(cacheKey, { at: Date.now(), fileId: png.id, run: runName });
    return png.id;
  }
  return null;
}

export async function findDriveImageByName(
  parentId: string,
  fileName: string,
): Promise<string | null> {
  const cacheKey = `${parentId}:${fileName}`;
  const cached = cacheGet(driveImageCache, cacheKey);
  if (cached) return cached.fileId;

  const file = await findFileByName(parentId, fileName);
  if (file?.id) {
    driveImageCache.set(cacheKey, { at: Date.now(), fileId: file.id });
    return file.id;
  }
  return null;
}

/** 在 exp 資料夾內找 run1 的 training_curve.png（或指定 run） */
export async function findTrainingCurveFile(
  expFolderId: string,
  runName?: string,
): Promise<{ fileId: string; run: string } | null> {
  if (runName) {
    const fileId = await findTrainingCurveForRun(expFolderId, runName);
    return fileId ? { fileId, run: runName } : null;
  }

  const runFolders = await sortedRunFolders(expFolderId);
  const searchRoots = runFolders.length ? runFolders : (await listDriveFolder(expFolderId)).filter(isFolder);

  for (const run of searchRoots) {
    const png = await findFileByName(run.id, "training_curve.png");
    if (png) return { fileId: png.id, run: run.name };
  }

  const queue: { id: string; depth: number; path: string }[] = [{ id: expFolderId, depth: 0, path: "" }];
  while (queue.length) {
    const { id, depth, path } = queue.shift()!;
    if (depth > 5) continue;
    const children = await listDriveFolder(id);
    for (const child of children) {
      const childPath = `${path}/${child.name}`;
      if (!isFolder(child)) {
        if (child.name === "training_curve.png") {
          const runMatch = childPath.match(/\/(run\d+)\//i);
          return { fileId: child.id, run: runMatch?.[1] ?? "run1" };
        }
        continue;
      }
      queue.push({ id: child.id, depth: depth + 1, path: childPath });
    }
  }

  return null;
}

export async function findConfusionMatrixForRun(
  expFolderId: string,
  runName: string,
): Promise<string | null> {
  const runFolder = await findChildFolder(expFolderId, runName);
  if (!runFolder) return null;
  const evalFinal =
    (await findChildFolder(runFolder.id, "evaluation_final_epoch")) ??
    (await findChildFolder(runFolder.id, "evaluation_best_validation"));
  if (!evalFinal) return null;
  const evidence = await findChildFolder(evalFinal.id, "confusion_evidence");
  if (!evidence) return null;
  const csv = await findFileByName(evidence.id, "confusion_matrix_normalized.csv");
  return csv?.id ?? null;
}

/** 在 exp 資料夾內找 evaluation_final_epoch 的 normalized confusion CSV */
export async function findConfusionMatrixFileId(
  expFolderId: string,
  runName?: string,
): Promise<string | null> {
  if (runName) {
    return findConfusionMatrixForRun(expFolderId, runName);
  }

  const runFolders = await sortedRunFolders(expFolderId);
  const searchRoots = runFolders.length ? runFolders : (await listDriveFolder(expFolderId)).filter(isFolder);

  for (const run of searchRoots) {
    const evalFinal =
      (await findChildFolder(run.id, "evaluation_final_epoch")) ??
      (await findChildFolder(run.id, "evaluation_best_validation"));
    if (!evalFinal) continue;

    const evidence = await findChildFolder(evalFinal.id, "confusion_evidence");
    if (!evidence) continue;

    const csv = await findFileByName(evidence.id, "confusion_matrix_normalized.csv");
    if (csv) return csv.id;
  }

  // 淺層 BFS 備援（根目錄 StarDist 專案結構可能不同）
  const queue: { id: string; depth: number }[] = [{ id: expFolderId, depth: 0 }];
  while (queue.length) {
    const { id, depth } = queue.shift()!;
    if (depth > 5) continue;
    const children = await listDriveFolder(id);
    for (const child of children) {
      if (!isFolder(child)) {
        if (child.name === "confusion_matrix_normalized.csv") return child.id;
        continue;
      }
      queue.push({ id: child.id, depth: depth + 1 });
    }
  }

  return null;
}
