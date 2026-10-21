/** Call experiments API locally (requires `npm run start` on port 3000) */
const local = [1, 4, 5, 8, 9, 10, 12, 13, 14, 17, 29, 35, 44];
const res = await fetch("http://localhost:3000/api/gdrive/experiments", { cache: "no-store" });
const d = await res.json();
const ids = new Set([...local, ...d.wsiConfigs.map((c) => c.expId)]);
const missing = [];
for (let i = 1; i <= 50; i++) if (!ids.has(i)) missing.push(i);
console.log("gdrive configs:", d.wsiConfigs.length);
console.log("missingExpIds from API:", d.missingExpIds?.join(", ") ?? "n/a");
console.log("merged with local missing:", missing.join(", ") || "none");
console.log("merged count:", ids.size);
