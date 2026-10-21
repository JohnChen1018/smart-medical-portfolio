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

async function downloadText(fileId) {
  const res = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  return res.text();
}

async function getPath(...names) {
  let id = names[0];
  for (let i = 1; i < names.length; i++) {
    const files = await listPublicFolder(id);
    const f = files.find((x) => x.name === names[i]);
    if (!f) throw new Error("missing " + names[i]);
    id = f.id;
  }
  return id;
}

const s1 = "14dM_EtcKGhLt87SV39zhpO_9-5Xh_m6-";
const ch = await listPublicFolder(s1);
const exp2 = ch.find((f) => f.name === "exp_002");

const confId = await getPath(exp2.id, "run1", "evaluation_final_epoch", "confusion_evidence");
const confFiles = await listPublicFolder(confId);
console.log("confusion_evidence:", confFiles.map((f) => f.name));

for (const f of confFiles.filter((x) => x.name.endsWith(".csv") || x.name.endsWith(".json"))) {
  const t = await downloadText(f.id);
  console.log("\n===", f.name, "===\n", t.slice(0, 800));
}

const runLogId = await getPath(exp2.id, "run1", "run_log.txt");
console.log("\nrun_log exists", runLogId);

const configId = await getPath(exp2.id, "run1", "config.json");
console.log("\nconfig:", (await downloadText(configId)).slice(0, 400));
