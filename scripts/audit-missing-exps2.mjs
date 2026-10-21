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

const checks = [
  { label: "student_5 (1)", id: "1HlmHLVR6-wRJqjshI12zr6oQ2cMU8iVJ" },
  { label: "student_9", id: "15CQwAtJmIOHgXHi_bjoVhbmxx3Dk30t6" },
  { label: "student_8_Oscar (1)", id: "1pD7ZbPPnGGzDZxnI6wAIIXWeP28KYTvZ" },
  { label: "student_1_Lin", id: "1KNpWSOK6GwNQ39S5jDrgBBkwAOOokEkC" },
  { label: "student_1", id: "1E2mPEKFE8K7ve7006Ywp_jygxuWNIHoL" },
];

for (const c of checks) {
  const children = await listPublicFolder(c.id);
  const csv = children.find((f) => f.name === "student_summary_10runs.csv");
  console.log(`\n=== ${c.label} ===`);
  if (csv) {
    const text = await downloadText(csv.id);
    console.log(text.slice(0, 800));
  }
}

// exp_028 run11_mean_std
const exp28 = "13scJjcBF5wnwVzK6tgX-XHLk6Nx_Caal";
const inner = await listPublicFolder(exp28);
const meanStd = inner.find((f) => f.name === "run11_mean_std");
if (meanStd) {
  console.log("\n=== exp_028 run11_mean_std ===");
  const files = await listPublicFolder(meanStd.id);
  console.log(files.map((f) => `${f.name} folder=${f.isFolder}`));
  const csv = files.find((f) => f.name.endsWith(".csv"));
  if (csv) {
    const text = await downloadText(csv.id);
    console.log(text.slice(0, 600));
  }
}

// exp_002 inside student_1_林彥昀
const s1 = "14dM_EtcKGhLt87SV39zhpO_9-5Xh_m6-";
const ch = await listPublicFolder(s1);
const exp2 = ch.find((f) => f.name === "exp_002");
if (exp2) {
  console.log("\n=== exp_002 tree ===");
  const l1 = await listPublicFolder(exp2.id);
  console.log("L1:", l1.map((x) => x.name));
  const run1 = l1.find((x) => x.name === "run1");
  if (run1) {
    const l2 = await listPublicFolder(run1.id);
    console.log("run1:", l2.map((x) => x.name).slice(0, 20));
    const evalF = l2.find((x) => /eval/i.test(x.name));
    if (evalF) {
      const l3 = await listPublicFolder(evalF.id);
      console.log("eval:", l3.map((x) => x.name));
    }
  }
  const meanStd = l1.find((x) => /mean/i.test(x.name));
  if (meanStd) {
    const l2 = await listPublicFolder(meanStd.id);
    console.log(meanStd.name, l2.map((x) => x.name));
  }
}
