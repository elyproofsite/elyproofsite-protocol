// Asset pipeline. Reads the logo files in brand/ and writes web-ready derivatives to public/.
// Findings recorded from reading every byte of the brand files:
//   "LOGO ELYPROOF PNG...png" : IHDR 2000x2000, 8-bit, colour type 6 (RGBA). 3,581,285 of 4,000,000 pixels are
//                               alpha 0 AND pure black rgb(0,0,0). A naive resize would bleed black into the edge
//                               pixels, so every resize below goes through premultiplied alpha (libvips premultiplies
//                               RGBA before a resample and un-premultiplies after).
//   "LOGO ELYPROOF PNG.png"   : IHDR 2000x2000, 8-bit, colour type 2 (RGB, opaque). Background pixel rgb(4,23,27).
//   "LOGO ELYPROOF JPG.jpg.jpeg": JFIF, same artwork on the same background.
// Palette (sampled from the pixel grid, see src/style.css for the provenance table):
//   #04171b background, #fdfdfd mark, #2b8ea1 / #3bbce6 / #5edcee / #7ae9e6 check-stroke gradient stops.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const brand = (f) => path.join(root, 'brand', f);
const out = (f) => path.join(root, 'public', f);
fs.mkdirSync(out('brand'), { recursive: true });

const RGBA = brand('LOGO ELYPROOF PNG...png');
const OPAQUE = brand('LOGO ELYPROOF PNG.png');
for (const f of [RGBA, OPAQUE]) if (!fs.existsSync(f)) throw new Error('missing brand file: ' + f);

// bounding box of the visible mark (alpha > 8) in the RGBA master
const { data, info } = await sharp(RGBA).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
let x0 = info.width, y0 = info.height, x1 = 0, y1 = 0;
for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
  if (data[(y * info.width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
}
const side = Math.max(x1 - x0, y1 - y0) + 1;
const pad = Math.round(side * 0.06);
const box = side + pad * 2;
const left = Math.max(0, Math.round((x0 + x1) / 2 - box / 2));
const top = Math.max(0, Math.round((y0 + y1) / 2 - box / 2));
const crop = { left, top, width: Math.min(box, info.width - left), height: Math.min(box, info.height - top) };

const square = () => sharp(RGBA).extract(crop);
for (const s of [64, 128, 256, 512]) {
  await square().resize(s, s, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile(out(`brand/logo-${s}.png`));
}
await sharp(OPAQUE).extract(crop).resize(180, 180, { kernel: 'lanczos3' }).png().toFile(out('apple-touch-icon.png'));
await sharp(OPAQUE).extract(crop).resize(192, 192).png().toFile(out('icon-192.png'));
await sharp(OPAQUE).extract(crop).resize(512, 512).png().toFile(out('icon-512.png'));

// social card: logo centred on the sampled background colour
const mark = await square().resize(360, 360).png().toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 4, background: { r: 4, g: 23, b: 27, alpha: 1 } } })
  .composite([{ input: mark, left: 420, top: 135 }]).png().toFile(out('og.png'));

// favicon: 32x32 pixel grid of the opaque master, emitted as horizontal runs of rects
const fav = await sharp(OPAQUE).extract(crop).resize(32, 32, { kernel: 'lanczos3' }).removeAlpha().raw().toBuffer();
const hex = (r, g, b) => '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
const q = (n) => Math.min(255, Math.round(n / 4) * 4);
let rects = '';
for (let y = 0; y < 32; y++) {
  let x = 0;
  while (x < 32) {
    const i = (y * 32 + x) * 3;
    const c = hex(q(fav[i]), q(fav[i + 1]), q(fav[i + 2]));
    let w = 1;
    while (x + w < 32) { const j = (y * 32 + x + w) * 3; if (hex(q(fav[j]), q(fav[j + 1]), q(fav[j + 2])) !== c) break; w++; }
    rects += `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${c}"/>`;
    x += w;
  }
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" shape-rendering="crispEdges">${rects}</svg>\n`;
if (svg.includes('--')) throw new Error('favicon contains a double hyphen');
fs.writeFileSync(out('favicon.svg'), svg);
console.log('assets ready; crop', crop, 'favicon bytes', svg.length);
