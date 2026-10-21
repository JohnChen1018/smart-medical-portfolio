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

const TARGETS = [2, 3, 6, 28, 34, 37, 38, 39, 47];
const root = "1k3oCXPchJL6IRj_5vAb5BBivjHt10gZZ";
const students = (await listPublicFolder(root)).filter((f) => f.isFolder && /^student/i.test(f.name));

function inspectCsv(text, label) {
  const lines = text.trim().split(/\r?\n/);
  const header = parseCsvLine(lines[0]);
  const idx = (n) => header.indexOf(n);
  for (const line of lines.slice(1)) {
    const row = parseCsvLine(line);
    const exp = Number(row[idx("exp_id")]);
    if (!TARGETS.includes(exp)) continue;
    const ck = row[idx("checkpoint_type")];
    const li = idx("train_loss_weights");
    console.log(
      `${label} exp ${exp} ck=${ck} rowLen=${row.length}/${header.length} loss=${JSON.stringify(row[li])} filter=${row[idx("unet_n_filter_base")]}`,
    );
    if (row.length !== header.length) {
      console.log("  HEADER:", header.join(" | "));
      console.log("  ROW:", row.join(" | "));
    }
  }
}

for (const s of students) {
  const kids = await listPublicFolder(s.id);
  const csv = kids.find((f) => f.name === "student_summary_10runs.csv");
  if (csv) inspectCsv(await downloadText(csv.id), `student ${s.name}`);
  for (const t of TARGETS) {
    const expName = `exp_${String(t).padStart(3, "0")}`;
    const expFolder = kids.find((f) => f.isFolder && f.name === expName);
    if (!expFolder) continue;
    const inner = await listPublicFolder(expFolder.id);
    const perCsv = inner.find((f) => f.name === "student_summary_10runs.csv");
    if (perCsv) inspectCsv(await downloadText(perCsv.id), `${s.name}/${expName}`);
  }
}
