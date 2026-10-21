const r = await fetch("http://localhost:3000/api/gdrive/experiments").then((x) => x.json());
const byExp = new Map();
for (const f of r.expFoldersFound) {
  if (!byExp.has(f.expId)) byExp.set(f.expId, f.driveFolderId);
}

const sample = [1, 10, 28, 34, 42, 49, 50];
let ok = 0;
let fail = 0;
for (const id of sample) {
  const folderId = byExp.get(id);
  if (!folderId) {
    console.log(`exp_${String(id).padStart(2, "0")}: NO FOLDER`);
    fail++;
    continue;
  }
  const c = await fetch(`http://localhost:3000/api/gdrive/confusion?folderId=${folderId}`).then((x) => x.json());
  if (c.ok) {
    console.log(`exp_${String(id).padStart(2, "0")}: OK (${c.confusion.rows.length} rows)`);
    ok++;
  } else {
    console.log(`exp_${String(id).padStart(2, "0")}: FAIL ${c.error}`);
    fail++;
  }
}
console.log(`sample ${ok}/${sample.length} confusion loaded`);
