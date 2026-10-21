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

const root = "1k3oCXPchJL6IRj_5vAb5BBivjHt10gZZ";
const students = (await listPublicFolder(root)).filter((f) => f.isFolder);
for (const s of students) {
  const kids = await listPublicFolder(s.id);
  const exps = kids.filter((f) => f.isFolder && /exp_00(2|3|6)/.test(f.name));
  if (exps.length) console.log(s.name, exps.map((e) => e.name));
}
