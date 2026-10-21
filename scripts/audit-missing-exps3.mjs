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

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

async function readStudentCsv(folderId, label) {
  const children = await listPublicFolder(folderId);
  const csv = children.find((f) => f.name === "student_summary_10runs.csv");
  if (!csv) return console.log(label, "no csv");
  const text = await downloadText(csv.id);
  const lines = text.trim().split(/\r?\n/);
  const header = parseCsvLine(lines[0]);
  const idx = (n) => header.indexOf(n);
  console.log(`\n${label}:`);
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    console.log(`  exp=${row[idx("exp_id")]} ck=${row[idx("checkpoint_type")]} mPQ+=${row[idx("mPQ+_mean")]} status=${row[idx("status")]}`);
  }
}

await readStudentCsv("1HlmHLVR6-wRJqjshI12zr6oQ2cMU8iVJ", "student_5 (1)");
await readStudentCsv("15CQwAtJmIOHgXHi_bjoVhbmxx3Dk30t6", "student_9");
await readStudentCsv("1pD7ZbPPnGGzDZxnI6wAIIXWeP28KYTvZ", "student_8_Oscar (1)");

const exp28 = "13scJjcBF5wnwVzK6tgX-XHLk6Nx_Caal";
const inner = await listPublicFolder(exp28);
const meanStd = inner.find((f) => f.name === "run11_mean_std");
const files = await listPublicFolder(meanStd.id);
const summary = files.find((f) => f.name === "summary_10runs_mean_std.csv");
const text = await downloadText(summary.id);
console.log("\nexp_028 summary_10runs_mean_std.csv:\n", text.slice(0, 1200));

// exp_037 folder
const s5 = await listPublicFolder("1HlmHLVR6-wRJqjshI12zr6oQ2cMU8iVJ");
const exp37 = s5.find((f) => f.name === "exp_037");
const e37inner = await listPublicFolder(exp37.id);
console.log("\nexp_037 top:", e37inner.map((x) => x.name));
const ms = e37inner.find((x) => x.name === "run11_mean_std");
if (ms) {
  const msf = await listPublicFolder(ms.id);
  const sc = msf.find((f) => f.name === "summary_10runs_mean_std.csv");
  if (sc) console.log(await downloadText(sc.id));
}
