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

async function checkExp(folderId, name) {
  const inner = await listPublicFolder(folderId);
  const ms = inner.find((f) => f.name === "run11_mean_std");
  console.log(name, "has run11_mean_std?", Boolean(ms), "runs:", inner.filter((x) => /^run\d/.test(x.name)).map((x) => x.name));
}

const targets = [
  ["exp_002", "14dM_EtcKGhLt87SV39zhpO_9-5Xh_m6-", "exp_002"],
  ["exp_003", "14dM_EtcKGhLt87SV39zhpO_9-5Xh_m6-", "exp_003"],
  ["exp_006", "1KNpWSOK6GwNQ39S5jDrgBBkwAOOokEkC", "exp_006"],
  ["exp_039", "15CQwAtJmIOHgXHi_bjoVhbmxx3Dk30t6", "exp_039"],
  ["exp_047", "1Pxxrk7hkW1DNwcctyWvO-aRJR3lbdcnO", "exp_047"],
];

for (const [label, parentId, expName] of targets) {
  const parent = await listPublicFolder(parentId);
  const exp = parent.find((f) => f.name === expName);
  if (exp) await checkExp(exp.id, label);
  else console.log(label, "NOT FOUND in parent");
}
