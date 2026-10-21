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
  if (depth > 6) return;
  const items = await listPublicFolder(folderId);
  for (const item of items) {
    const p = `${path}/${item.name}`;
    if (item.name.includes("confusion")) console.log("FOUND", p, item.id, item.isFolder);
    if (item.isFolder) await walk(item.id, depth + 1, p);
  }
}

// student_1 exp_042
const root = await listPublicFolder("1k3oCXPchJL6IRj_5vAb5BBivjHt10gZZ");
const s1 = root.find((x) => x.name === "student_1");
const s1c = await listPublicFolder(s1.id);
const exp42 = s1c.find((x) => x.name === "exp_042");
console.log("exp_042", exp42);
await walk(exp42.id);
