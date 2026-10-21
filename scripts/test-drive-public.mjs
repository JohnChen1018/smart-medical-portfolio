async function listPublicFolder(folderId) {
  const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${folderId}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const html = await res.text();
  const items = [];
  for (const m of html.matchAll(/id="entry-([^"]+)"[\s\S]*?flip-entry-title">([^<]+)/g)) {
    items.push({ id: m[1], name: m[2].trim() });
  }
  return items;
}

const root = await listPublicFolder("1k3oCXPchJL6IRj_5vAb5BBivjHt10gZZ");
const s1 = root.find((x) => x.name === "student_1");
console.log("student_1", s1);
if (s1) {
  const exps = await listPublicFolder(s1.id);
  console.log(
    "exp folders",
    exps.filter((e) => /^exp_/i.test(e.name)),
  );
}
