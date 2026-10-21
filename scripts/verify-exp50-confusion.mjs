const r = await fetch("http://localhost:3000/api/gdrive/experiments").then((x) => x.json());
const ids = new Set(r.expFoldersFound.map((f) => f.expId));
const missing = [];
for (let i = 1; i <= 50; i++) if (!ids.has(i)) missing.push(i);
console.log("unique exp folders", ids.size, "missing", missing);

const exp42 = r.expFoldersFound.find((f) => f.expId === 42);
console.log("exp42 folder", exp42?.driveFolderId);

if (exp42?.driveFolderId) {
  const c = await fetch(`http://localhost:3000/api/gdrive/confusion?folderId=${exp42.driveFolderId}`).then((x) => x.json());
  console.log("confusion ok", c.ok, "labels", c.confusion?.labels?.length);
}

const exp28 = r.expFoldersFound.find((f) => f.expId === 28);
console.log("exp28", exp28);
