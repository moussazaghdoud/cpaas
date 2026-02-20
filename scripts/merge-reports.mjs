import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const orig = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/discovery-report.json'), 'utf-8'));
const auth = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/auth-discovery-report.json'), 'utf-8'));

const existingUrls = new Set(orig.pages.map(p => p.url));
let added = 0;

for (const p of auth.pages) {
  if (existingUrls.has(p.url)) continue;
  orig.pages.push(p);
  existingUrls.add(p.url);
  added++;
}

// Merge all discovered URLs
const allUrlSet = new Set([...(orig.allUrls || []), ...(auth.allUrls || [])]);
orig.allUrls = [...allUrlSet].sort();

// Merge errors (deduplicate)
const errorUrls = new Set((orig.errors || []).map(e => e.url || e));
for (const e of (auth.errors || [])) {
  const url = e.url || e;
  if (errorUrls.has(url)) continue;
  orig.errors.push(e);
}

orig.summary.totalPagesCrawled = orig.pages.length;
orig.summary.totalPagesDiscovered = allUrlSet.size;
orig.summary.mergedAt = new Date().toISOString();

fs.writeFileSync(path.join(ROOT, 'content/discovery-report.json'), JSON.stringify(orig, null, 2));

console.log(`Merged: ${added} new pages added`);
console.log(`Total pages now: ${orig.pages.length}`);
console.log(`Total URLs discovered: ${allUrlSet.size}`);
