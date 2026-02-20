import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const main = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/discovery-report.json'), 'utf-8'));
const final = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/final-crawl-report.json'), 'utf-8'));

const existingUrls = new Set(main.pages.map(p => p.url));
let added = 0;
let skippedEmpty = 0;

for (const p of final.pages) {
  if (existingUrls.has(p.url)) continue;
  if (p.textLength < 100) { skippedEmpty++; continue; } // Skip empty pages
  main.pages.push({
    url: p.url,
    path: p.path,
    title: p.title,
    h1: p.h1,
    pageType: 'sdk',
    textLength: p.textLength,
    lastFetchedAt: new Date().toISOString(),
  });
  added++;
}

main.summary.totalPagesCrawled = main.pages.length;
fs.writeFileSync(path.join(ROOT, 'content/discovery-report.json'), JSON.stringify(main, null, 2));

console.log(`Added: ${added} pages with content`);
console.log(`Skipped: ${skippedEmpty} empty pages`);
console.log(`Total pages: ${main.pages.length}`);
