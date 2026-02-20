import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const auth = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/auth-discovery-report.json'), 'utf-8'));
const crawledUrls = new Set(auth.pages.map(p => p.url));
const errorUrls = new Set(auth.errors.map(e => e.url || e));
const missing = auth.allUrls.filter(u => {
  return !crawledUrls.has(u) && !errorUrls.has(u);
});

const sections = {};
for (const u of missing) {
  try {
    const p = new URL(u).pathname;
    const parts = p.split('/').filter(Boolean);
    const key = parts.slice(0, 4).join('/');
    if (!sections[key]) sections[key] = [];
    sections[key].push(p);
  } catch {}
}

console.log(`Missing pages: ${missing.length}\n`);
const sorted = Object.entries(sections).sort((a, b) => b[1].length - a[1].length);
for (const [section, pages] of sorted) {
  console.log(`${section}: ${pages.length} pages`);
  for (const p of pages.slice(0, 5)) {
    console.log(`  ${p}`);
  }
  if (pages.length > 5) console.log(`  ... +${pages.length - 5} more`);
  console.log();
}
