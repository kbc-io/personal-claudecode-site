import sharp from 'sharp';
import { readdirSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';

const ROOT = 'src/case-studies';
const MAX = 2400;
const exts = ['.png', '.jpg', '.jpeg'];
let before = 0, after = 0, n = 0;

function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) { walk(p); continue; }
    const lower = e.toLowerCase();
    const ext = exts.find(x => lower.endsWith(x));
    if (!ext) continue;
    const out = p.slice(0, -ext.length) + '.webp';
    before += st.size;
    const buf = readBuf(p);
    process.stdout.write('.');
    jobs.push({ p, out, ext });
  }
}
function readBuf(){}
const jobs = [];
walk(ROOT);

for (const j of jobs) {
  const meta = await sharp(j.p).metadata();
  const longEdge = Math.max(meta.width, meta.height);
  let img = sharp(j.p);
  if (longEdge > MAX) {
    img = img.resize({ width: meta.width >= meta.height ? MAX : null,
                       height: meta.height > meta.width ? MAX : null,
                       fit: 'inside' });
  }
  await img.webp({ quality: 80 }).toFile(j.out);
  const sz = statSync(j.out).size;
  after += sz;
  unlinkSync(j.p);
  n++;
}
console.log(`\nConverted ${n} files. Before ${(before/1e6).toFixed(1)}MB -> After ${(after/1e6).toFixed(1)}MB`);
