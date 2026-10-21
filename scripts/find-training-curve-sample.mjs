import { findConfusionMatrixFileId, listDriveFolder, findChildFolder } from "../src/lib/googleDrive.ts";

async function findTrainingCurve(expFolderId) {
  const top = await listDriveFolder(expFolderId);
  const runFolders = top
    .filter((f) => f.mimeType === "application/vnd.google-apps.folder" && /^run\d+$/i.test(f.name))
    .sort((a, b) => parseInt(a.name.replace(/\D/g, ""), 10) - parseInt(b.name.replace(/\D/g, ""), 10));
  for (const run of runFolders.length ? runFolders : top.filter((f) => f.mimeType === "application/vnd.google-apps.folder")) {
    const children = await listDriveFolder(run.id);
    const png = children.find((f) => f.name === "training_curve.png");
    if (png) return { fileId: png.id, run: run.name };
  }
  return null;
}

const samples = [
  ["exp_01", null],
  ["exp_49", "1PML17wvVy2r0sA4hDETYXcp54K8XXUs5"],
  ["exp_50", "1a9MpAKVBa3bSp5Bvq0nXUF7ujoeXWyUw"],
];

const r = await fetch("http://localhost:3000/api/gdrive/experiments").then((x) => x.json());
for (const [label, override] of samples) {
  const expId = label === "exp_01" ? 1 : label === "exp_49" ? 49 : 50;
  const folder = r.expFoldersFound.find((f) => f.expId === expId);
  const folderId = override ?? folder?.driveFolderId;
  const found = folderId ? await findTrainingCurve(folderId) : null;
  console.log(label, folderId, found);
}
