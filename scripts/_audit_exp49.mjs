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

async function walk(id, name, depth) {
  const pad = "  ".repeat(depth);
  const kids = await listPublicFolder(id);
  for (const k of kids) {
    console.log(`${pad}${k.isFolder ? "[D]" : "   "} ${k.name}`);
    if (k.isFolder && depth < 2) await walk(k.id, k.name, depth + 1);
  }
}

const exp49Root = "1PML17wvVy2r0sA4hDETYXcp54K8XXUs5";
console.log("=== exp49 root ===");
const rootKids = await listPublicFolder(exp49Root);
const student2 = rootKids.find((k) => /^student/i.test(k.name));
const s2kids = await listPublicFolder(student2.id);
const exp451 = s2kids.find((k) => /^exp_/i.test(k.name));
console.log("exp451 id:", exp451.id);
const run1 = (await listPublicFolder(exp451.id)).find((k) => k.name === "run1");
console.log("run1 files:");
for (const f of await listPublicFolder(run1.id)) console.log("   ", f.name);
