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

async function exploreRun(expFolderId, runName) {
  const runs = await listPublicFolder(expFolderId);
  const run = runs.find((f) => f.name === runName);
  if (!run) return console.log("no", runName);
  const files = await listPublicFolder(run.id);
  console.log(runName, files.map((f) => f.name));
  const json = files.find((f) => f.name.endsWith(".json") && !f.name.includes("config"));
  if (json) {
    const t = await downloadText(json.id);
    console.log(json.name, t.slice(0, 500));
  }
  const evalF = files.find((f) => f.name.startsWith("evaluation"));
  if (evalF) {
    const ev = await listPublicFolder(evalF.id);
    console.log(" ", evalF.name, ev.map((x) => x.name));
  }
}

const s1 = "14dM_EtcKGhLt87SV39zhpO_9-5Xh_m6-";
const ch = await listPublicFolder(s1);
const exp2 = ch.find((f) => f.name === "exp_002");
await exploreRun(exp2.id, "run1");
await exploreRun(exp2.id, "run10");

const lin = "1KNpWSOK6GwNQ39S5jDrgBBkwAOOokEkC";
const ch2 = await listPublicFolder(lin);
const exp6 = ch2.find((f) => f.name === "exp_006");
await exploreRun(exp6.id, "run1");

// exp_039 summary mPQ
const s9 = await listPublicFolder("15CQwAtJmIOHgXHi_bjoVhbmxx3Dk30t6");
const e39 = s9.find((f) => f.name === "exp_039");
const e39in = await listPublicFolder(e39.id);
const ms = e39in.find((f) => f.name === "run11_mean_std");
const msf = await listPublicFolder(ms.id);
const csv = msf.find((f) => f.name === "summary_10runs_mean_std.csv");
const text = await downloadText(csv.id);
const lines = text.split("\n").filter((l) => l.includes("mPQ+") && l.includes("final_epoch"));
console.log("\nexp_039 mPQ final_epoch rows:", lines);
