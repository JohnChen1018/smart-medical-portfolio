const base = process.env.BASE_URL ?? "http://localhost:3001";
const r = await fetch(`${base}/api/gdrive/experiments`).then((x) => x.json());
const byExp = new Map();
for (const f of r.expFoldersFound) {
  if (!byExp.has(f.expId)) byExp.set(f.expId, f.driveFolderId);
}

let ok = 0;
const fail = [];
for (let id = 1; id <= 50; id++) {
  const folderId = byExp.get(id);
  if (!folderId) {
    fail.push({ id, reason: "no_folder" });
    continue;
  }
  const res = await fetch(`${base}/api/gdrive/training-chart?folderId=${folderId}`);
  const type = res.headers.get("content-type") ?? "";
  if (res.ok && type.includes("image")) ok++;
  else fail.push({ id, reason: `${res.status} ${type.slice(0, 30)}` });
}
console.log(`training charts: ${ok}/50 OK`);
if (fail.length) console.log("failed", fail);
