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

async function downloadCsv(fileId) {
  const res = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  return res.text();
}

function parseExpIds(csv) {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0].split(",");
  const expIdx = header.indexOf("exp_id");
  const ckIdx = header.indexOf("checkpoint_type");
  const mpqIdx = header.indexOf("mPQ+_mean");
  const ids = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(",");
    if (row[ckIdx] !== "final_epoch") continue;
    ids.push({ expId: Number(row[expIdx]), mPQ: row[mpqIdx] });
  }
  return ids;
}

const ROOT = process.env.GOOGLE_DRIVE_WSI_ROOT_FOLDER_ID ?? "1k3oCXPchJL6IRj_5vAb5BBivjHt10gZZ";
const TARGET = [2, 3, 6, 28, 34, 37, 38, 39, 47];

const root = await listPublicFolder(ROOT);
const students = root.filter((f) => f.isFolder && /^student/i.test(f.name));
const rootExps = root.filter((f) => f.isFolder && /^exp_/i.test(f.name));

console.log("=== ROOT STUDENTS ===");
for (const s of students.sort((a, b) => a.name.localeCompare(b.name))) {
  console.log(s.name, s.id);
}
console.log("\n=== ROOT EXP FOLDERS ===");
for (const e of rootExps) console.log(e.name, e.id);

console.log("\n=== SCAN FOR TARGET EXPS ===");
for (const s of students) {
  const children = await listPublicFolder(s.id);
  const csv = children.find((f) => f.name === "student_summary_10runs.csv");
  const exps = children.filter((f) => f.isFolder && /^exp_/i.test(f.name));
  const targetExps = exps.filter((e) => TARGET.includes(parseInt(e.name.replace(/\D/g, ""), 10)));
  if (csv || targetExps.length) {
    console.log(`\n--- ${s.name} ---`);
    if (csv) {
      try {
        const text = await downloadCsv(csv.id);
        const parsed = parseExpIds(text);
        const hits = parsed.filter((p) => TARGET.includes(p.expId));
        console.log("CSV exp count:", parsed.length, "target hits:", hits);
        if (hits.length) hits.forEach((h) => console.log(" ", h));
      } catch (e) {
        console.log("CSV error:", e.message);
      }
    } else {
      console.log("NO student_summary CSV");
    }
    if (targetExps.length) {
      console.log("target exp folders:", targetExps.map((x) => x.name));
      for (const ef of targetExps) {
        const inner = await listPublicFolder(ef.id);
        const innerCsv = inner.find((f) => f.name === "student_summary_10runs.csv");
        console.log(" ", ef.name, "inner csv?", Boolean(innerCsv));
      }
    }
  }
}

for (const e of rootExps) {
  const id = parseInt(e.name.replace(/\D/g, ""), 10);
  if (!TARGET.includes(id)) continue;
  console.log(`\n--- root ${e.name} ---`);
  const inner = await listPublicFolder(e.id);
  console.log("children:", inner.map((x) => x.name).slice(0, 15));
  const csv = inner.find((f) => f.name.includes("summary") && f.name.endsWith(".csv"));
  if (csv) console.log("found csv:", csv.name);
}
