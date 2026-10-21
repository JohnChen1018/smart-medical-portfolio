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
const stardist = root.filter((f) => f.name.includes("StarDist_6class") && f.isFolder);
console.log(JSON.stringify(stardist, null, 2));

for (const folder of stardist) {
  console.log("\n---", folder.name, "---");
  const children = await listPublicFolder(folder.id);
  console.log(children.slice(0, 20).map((c) => `${c.isFolder ? "[D]" : "[F]"} ${c.name}`).join("\n"));
}
