import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const srcDir = path.join(process.cwd(), "public", "lizard");
const dest = path.join(process.cwd(), "data", "lizard-thumbs");
fs.mkdirSync(dest, { recursive: true });

const files = fs.readdirSync(srcDir).filter((file) => /^conic_\d{6}\.png$/i.test(file));
let cursor = 0;
let made = 0;

async function worker() {
  while (cursor < files.length) {
    const file = files[cursor];
    cursor += 1;
    const out = path.join(dest, file.replace(/\.png$/i, ".jpg"));
    if (fs.existsSync(out)) continue;
    await sharp(path.join(srcDir, file)).resize(160, 160, { fit: "cover" }).jpeg({ quality: 62 }).toFile(out);
    made += 1;
  }
}

const started = Date.now();
await Promise.all(Array.from({ length: 8 }, () => worker()));
console.log(`thumbs ${files.length} new ${made} ms ${Date.now() - started}`);
