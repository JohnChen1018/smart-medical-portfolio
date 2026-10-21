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

async function walk(folderId, depth = 0, path = "") {
  if (depth > 5) return [];
  const found = [];
  const items = await listPublicFolder(folderId);
  for (const item of items) {
    const p = `${path}/${item.name}`;
    const lower = item.name.toLowerCase();
    if (!item.isFolder && /\.(png|jpg|jpeg)$/i.test(item.name)) {
      if (/train|loss|curve|metric|history|learning|pq|plot|chart/i.test(item.name) || /train|loss|curve|metric|history|plot/i.test(p)) {
        found.push({ path: p, name: item.name, id: item.id });
      }
    }
    if (item.isFolder) found.push(...(await walk(item.id, depth + 1, p)));
  }
  return found;
}

const exp42 = "1muLoSIrjeXCmSy2UNZBPQYjMsT2iJ6vS";
const imgs = await walk(exp42);
console.log("training-like images in exp_042:", imgs.length);
for (const img of imgs.slice(0, 30)) console.log(img.path);

// also list all png at run1 level
const top = await listPublicFolder(exp42);
const run1 = top.find((x) => x.name === "run1");
if (run1) {
  const runItems = await walk(run1.id, 0, "/run1");
  const allPng = runItems.filter((x) => /\.png$/i.test(x.name));
  console.log("\nall png under run1:", allPng.length);
  for (const p of allPng.slice(0, 40)) console.log(p.path, p.name);
}
