async function listPublicFolder(folderId) {
  const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${folderId}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const html = await res.text();
  const files = [];
  for (const m of html.matchAll(/id="entry-([^"]+)"[\s\S]*?flip-entry-title">([^<]+)/g)) {
    files.push({ id: m[1], name: m[2].trim() });
  }
  for (const file of files) {
    const block = html.match(new RegExp(`id="entry-${file.id}"[\\s\\S]*?(?=id="entry-|$)`));
    file.isFolder = block ? /folder-list-shared|folder-grid-shared|drive-sprite-folder/.test(block[0]) : false;
  }
  return files;
}

const root = await listPublicFolder("1k3oCXPchJL6IRj_5vAb5BBivjHt10gZZ");
for (const name of ["exp_028", "exp_034", "exp_028", "exp_034"]) {
  const f = root.find((x) => x.name === name || x.name === name.replace("_0", "_"));
}
const exps = root.filter((f) => /^exp_/i.test(f.name));
console.log("root exp folders", exps);

// count 1-50 coverage
const r = await fetch("http://localhost:3000/api/gdrive/experiments").then((x) => x.json());
const folderIds = new Set(r.expFoldersFound.map((f) => f.expId));
const configIds = new Set(r.wsiConfigs.map((c) => c.expId));
const missing = [];
for (let i = 1; i <= 50; i++) {
  if (!folderIds.has(i) && !configIds.has(i)) missing.push(i);
}
console.log("missing 1-50", missing);
console.log("config count", r.wsiConfigs.length, "unique expIds", new Set(r.wsiConfigs.map((c) => c.expId)).size);
