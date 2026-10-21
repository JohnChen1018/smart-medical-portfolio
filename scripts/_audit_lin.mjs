import { inflateRawSync, inflateSync } from "node:zlib";

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

async function downloadBinary(fileId) {
  const res = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  return Buffer.from(await res.arrayBuffer());
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

function readZipEntry(buf, entryName) {
  let offset = 0;
  while (offset < buf.length - 30) {
    const sig = buf.readUInt32LE(offset);
    if (sig !== 0x04034b50) break;
    const compMethod = buf.readUInt16LE(offset + 8);
    const compSize = buf.readUInt32LE(offset + 18);
    const fileNameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const name = buf.subarray(offset + 30, offset + 30 + fileNameLen).toString("utf8");
    const dataStart = offset + 30 + fileNameLen + extraLen;
    const compData = buf.subarray(dataStart, dataStart + compSize);
    if (name === entryName) {
      if (compMethod === 0) return Buffer.from(compData);
      if (compMethod === 8) {
        try {
          return Buffer.from(inflateRawSync(compData));
        } catch {
          return Buffer.from(inflateSync(compData));
        }
      }
    }
    offset = dataStart + compSize;
  }
  return null;
}

function parseHp(buf) {
  const zip = buf;
  const sharedXml = readZipEntry(zip, "xl/sharedStrings.xml");
  const shared = sharedXml ? [...sharedXml.toString("utf8").matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((m) => m[1]) : [];
  const hpSheet = readZipEntry(zip, "xl/worksheets/sheet2.xml");
  const hyperparams = {};
  if (!hpSheet) return hyperparams;
  const rows = [...hpSheet.toString("utf8").matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)];
  for (const row of rows.slice(1)) {
    const cells = [...row[1].matchAll(/<c r="([A-Z]+)(\d+)"([^>]*)>([\s\S]*?)<\/c>/g)];
    let key = "";
    let val = "";
    for (const c of cells) {
      const col = c[1];
      const type = /t="s"/.test(c[3]) ? "s" : "n";
      const vMatch = c[4].match(/<v>([^<]*)<\/v>/);
      const tMatch = c[4].match(/<t[^>]*>([^<]*)<\/t>/);
      let cell = "";
      if (tMatch) cell = tMatch[1];
      else if (vMatch) cell = type === "s" ? shared[Number(vMatch[1])] ?? vMatch[1] : vMatch[1];
      if (col === "A") key = cell;
      if (col === "B") val = cell;
    }
    if (key && val !== "") hyperparams[key] = val;
  }
  return hyperparams;
}

const root = "1k3oCXPchJL6IRj_5vAb5BBivjHt10gZZ";
const students = (await listPublicFolder(root)).filter((f) => f.isFolder);
const lin = students.find((f) => f.name === "student_1_林彥昀");
const kids = await listPublicFolder(lin.id);
console.log(
  "exp folders",
  kids.filter((f) => f.isFolder && /^exp_/i.test(f.name)).map((f) => f.name),
);

for (const expName of ["exp_002", "exp_003", "exp_006"]) {
  const expFolder = kids.find((f) => f.name === expName);
  if (!expFolder) {
    console.log(expName, "missing");
    continue;
  }
  const inner = await listPublicFolder(expFolder.id);
  console.log("\n", expName, "files", inner.map((f) => f.name).slice(0, 15));
  const csv = inner.find((f) => f.name === "student_summary_10runs.csv");
  if (csv) {
    const text = await downloadText(csv.id);
    const lines = text.trim().split(/\r?\n/);
    const header = parseCsvLine(lines[0]);
    const idx = (n) => header.indexOf(n);
    for (const line of lines.slice(1)) {
      const row = parseCsvLine(line);
      console.log("csv row ck", row[idx("checkpoint_type")], "loss", row[idx("train_loss_weights")], "len", row.length);
    }
  }
  const run1 = inner.find((f) => f.isFolder && f.name === "run1");
  if (run1) {
    const rf = await listPublicFolder(run1.id);
    const xlsx = rf.find((f) => f.name === "results_final_epoch.xlsx");
    if (xlsx) {
      const hp = parseHp(await downloadBinary(xlsx.id));
      console.log("xlsx hp", hp);
    }
  }
}

// exp_28 at root
const rootKids = await listPublicFolder(root);
const exp28 = rootKids.find((f) => f.name === "exp_28" || f.name === "exp_028");
if (exp28) {
  const inner = await listPublicFolder(exp28.id);
  const run1 = inner.find((f) => f.isFolder && f.name === "run1");
  if (run1) {
    const rf = await listPublicFolder(run1.id);
    const xlsx = rf.find((f) => f.name === "results_final_epoch.xlsx");
    if (xlsx) console.log("exp28 hp", parseHp(await downloadBinary(xlsx.id)));
  }
}
