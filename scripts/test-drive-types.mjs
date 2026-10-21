async function listPublicFolder(folderId) {
  const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${folderId}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const html = await res.text();
  const files = [];
  for (const m of html.matchAll(/id="entry-([^"]+)"[\s\S]*?flip-entry-title">([^<]+)/g)) {
    const name = m[2].trim();
    files.push({ id: m[1], name });
  }
  for (const file of files) {
    const block = html.match(new RegExp(`id="entry-${file.id}"[\\s\\S]*?(?=id="entry-|$)`));
    file.isFolder = block ? /folder-list-shared|folder-grid-shared|drive-sprite-folder/.test(block[0]) : false;
  }
  return files;
}

const root = await listPublicFolder("1k3oCXPchJL6IRj_5vAb5BBivjHt10gZZ");
const students = root.filter((f) => /^student/i.test(f.name));
console.log("students", students.length, students.slice(0, 3));
const s1 = root.find((f) => f.name === "student_1");
console.log("s1", s1);
if (s1) console.log(await listPublicFolder(s1.id));
