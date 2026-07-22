// Build-time image optimizer: converts the digital-art poster rasters (JPG/PNG) to WebP,
// resized to a sensible on-screen resolution. These load as Three.js textures via a single URL,
// so WebP (universally supported) is used rather than a <picture> AVIF/WebP fallback.
//
// Usage: node scripts/optimize-images.mjs        (writes .webp next to sources, prints a report)
//        node scripts/optimize-images.mjs --prune (also deletes the original JPG/PNG afterwards)
import { readdir, stat, unlink } from "node:fs/promises";
import { join, extname } from "node:path";
import sharp from "sharp";

const DIR = "public/products/digital/final";
const MAX_EDGE = 1440; // posters render <=~1000px on-screen; 1440 keeps headroom at DPR 1.5
const QUALITY = 82;
const prune = process.argv.includes("--prune");

const files = (await readdir(DIR)).filter((f) => /\.(jpe?g|png)$/i.test(f));
let before = 0;
let after = 0;
const rows = [];

for (const file of files) {
  const src = join(DIR, file);
  const out = join(DIR, file.replace(/\.(jpe?g|png)$/i, ".webp"));
  const srcBytes = (await stat(src)).size;
  await sharp(src)
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 5 })
    .toFile(out);
  const outBytes = (await stat(out)).size;
  before += srcBytes;
  after += outBytes;
  rows.push({ file, kb_before: Math.round(srcBytes / 1024), kb_after: Math.round(outBytes / 1024) });
  if (prune) await unlink(src);
}

rows.sort((a, b) => b.kb_before - a.kb_before);
for (const r of rows) console.log(`${String(r.kb_before).padStart(6)}KB -> ${String(r.kb_after).padStart(5)}KB  ${r.file}`);
console.log(`\nTOTAL: ${(before / 1024 / 1024).toFixed(2)}MB -> ${(after / 1024 / 1024).toFixed(2)}MB  (${Math.round((1 - after / before) * 100)}% smaller across ${files.length} files)`);
if (prune) console.log("Originals pruned.");
