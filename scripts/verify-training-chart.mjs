const base = process.env.BASE_URL ?? "http://localhost:3001";
const r = await fetch(`${base}/api/gdrive/experiments`).then((x) => x.json());
const byExp = new Map();
for (const f of r.expFoldersFound) {
  if (!byExp.has(f.expId)) byExp.set(f.expId, f.driveFolderId);
}

const sample = [1, 28, 42, 49, 50];
for (const id of sample) {
  const folderId = byExp.get(id);
  const res = await fetch(`${base}/api/gdrive/training-chart?folderId=${folderId}`);
  console.log(
    `exp_${String(id).padStart(2, "0")}:`,
    res.status,
    res.headers.get("content-type"),
    res.headers.get("x-training-run"),
    res.ok ? `${(await res.arrayBuffer()).byteLength} bytes` : await res.text().then((t) => t.slice(0, 80)),
  );
}
