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

async function downloadPublicFile(fileId) {
  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, redirect: "follow" });
  return res.text();
}

const s1Id = "1E2mPEKFE8K7ve7006Ywp_jygxuWNIHoL";
const files = await listPublicFolder(s1Id);
console.log("student_1 files", files);
const csv = files.find((f) => f.name === "student_summary_10runs.csv");
if (csv) {
  const text = await downloadPublicFile(csv.id);
  console.log("csv head", text.slice(0, 500));
}
