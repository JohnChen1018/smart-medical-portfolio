const r = await fetch("http://localhost:3000/api/gdrive/experiments").then((x) => x.json());
const byExp = new Map();
for (const f of r.expFoldersFound) {
  if (!byExp.has(f.expId)) byExp.set(f.expId, f.driveFolderId);
}

const results = [];
for (let id = 1; id <= 50; id++) {
  const folderId = byExp.get(id);
  if (!folderId) {
    results.push({ id, status: "no_folder" });
    continue;
  }
  const c = await fetch(`http://localhost:3000/api/gdrive/confusion?folderId=${folderId}`).then((x) => x.json());
  results.push({ id, status: c.ok ? "ok" : "fail", error: c.error });
}

const ok = results.filter((x) => x.status === "ok").length;
const noFolder = results.filter((x) => x.status === "no_folder");
const fail = results.filter((x) => x.status === "fail");
console.log(`confusion: ${ok}/50 OK`);
if (noFolder.length) console.log("no folder", noFolder.map((x) => x.id));
if (fail.length) console.log("failed", fail);
