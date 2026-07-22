// Build-time converter: raw STL (uncompressed, ~1.3MB each) -> Draco-compressed GLB.
// STL is text/binary-uncompressed and Vercel's CDN does NOT compress binary payloads, so these
// were shipping at full size. Draco quantizes geometry ~80-95% smaller and decodes in a worker.
//
// Visual parity: the runtime rendered STL with computeVertexNormals() (flat-ish). We bake the
// same normals here and weld() only merges vertices identical in BOTH position and normal, so the
// flat shading of the printed objects is preserved. The runtime keeps these baked normals.
//
// Usage: node scripts/convert-stl-to-glb.mjs [--prune]
import { readdir, stat, unlink, readFile } from "node:fs/promises";
import { join } from "node:path";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { Document, NodeIO } from "@gltf-transform/core";
import { KHRDracoMeshCompression } from "@gltf-transform/extensions";
import { draco, weld } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";

const DIR = "public/products/3d";
const prune = process.argv.includes("--prune");
const loader = new STLLoader();

const io = new NodeIO()
  .registerExtensions([KHRDracoMeshCompression])
  .registerDependencies({
    "draco3d.encoder": await draco3d.createEncoderModule(),
    "draco3d.decoder": await draco3d.createDecoderModule(),
  });

const files = (await readdir(DIR)).filter((f) => f.toLowerCase().endsWith(".stl"));
let before = 0;
let after = 0;
const rows = [];

for (const file of files) {
  const src = join(DIR, file);
  const buf = await readFile(src);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const geom = loader.parse(ab);
  geom.computeVertexNormals();
  const pos = geom.getAttribute("position");
  const nor = geom.getAttribute("normal");

  const doc = new Document();
  const scene = doc.createScene();
  const buffer = doc.createBuffer();
  const position = doc.createAccessor().setType("VEC3").setArray(Float32Array.from(pos.array)).setBuffer(buffer);
  const normal = doc.createAccessor().setType("VEC3").setArray(Float32Array.from(nor.array)).setBuffer(buffer);
  const prim = doc.createPrimitive().setAttribute("POSITION", position).setAttribute("NORMAL", normal);
  const mesh = doc.createMesh().addPrimitive(prim);
  scene.addChild(doc.createNode().setMesh(mesh));

  await doc.transform(weld(), draco());
  const out = join(DIR, file.replace(/\.stl$/i, ".glb"));
  await io.write(out, doc);

  const sB = (await stat(src)).size;
  const sA = (await stat(out)).size;
  before += sB;
  after += sA;
  rows.push({ file, kb_before: Math.round(sB / 1024), kb_after: Math.round(sA / 1024) });
  if (prune) await unlink(src);
}

rows.sort((a, b) => b.kb_before - a.kb_before);
for (const r of rows) console.log(`${String(r.kb_before).padStart(5)}KB -> ${String(r.kb_after).padStart(4)}KB  ${r.file}`);
console.log(`\nTOTAL: ${(before / 1024 / 1024).toFixed(2)}MB -> ${(after / 1024 / 1024).toFixed(2)}MB  (${Math.round((1 - after / before) * 100)}% smaller across ${files.length} models)`);
if (prune) console.log("STL originals pruned.");
