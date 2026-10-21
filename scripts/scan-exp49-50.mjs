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

async function downloadPublicFile(fileId) {
  const res = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
    redirect: "follow",
  });
  return res.text();
}

const rootExps = [
  { id: "1PML17wvVy2r0sA4hDETYXcp54K8XXUs5", label: "exp_49", match: "Exp451" },
  { id: "1a9MpAKVBa3bSp5Bvq0nXUF7ujoeXWyUw", label: "exp_50", match: "Exp450" },
];

for (const exp of rootExps) {
  console.log("\n===", exp.label, "===");
  const l1 = await listPublicFolder(exp.id);
  console.log("L1", l1);
  for (const s of l1.filter((x) => x.isFolder)) {
    const l2 = await listPublicFolder(s.id);
    console.log(" L2", s.name, l2.map((x) => x.name));
    const csv = l2.find((x) => x.name === "student_summary_10runs.csv");
    if (csv) {
      const text = await downloadPublicFile(csv.id);
      console.log(" CSV sample", text.split("\n").slice(0, 3).join("\n"));
    }
  }
}
