import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const r = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../content/discovery-report.json"), "utf-8"));

const crawledUrls = new Set(r.pages.map(p => p.url));
const errorUrls = new Set(r.errors.map(e => e.url || e));
const skipped = r.allUrls.filter(u => !crawledUrls.has(u) && !errorUrls.has(u));

console.log("=== CRAWL COVERAGE REPORT ===\n");
console.log(`Total URLs discovered: ${r.allUrls.length}`);
console.log(`Pages crawled:        ${r.pages.length}`);
console.log(`Errors:               ${r.errors.length}`);
console.log(`Skipped:              ${skipped.length}`);
console.log();

// Skipped breakdown
const sdkApiPattern = /\/doc\/sdk\/[^/]+\/[^/]+\/[^/]+\/api\//;
const sdkApi = skipped.filter(u => sdkApiPattern.test(u));
const otherSkip = skipped.filter(u => !sdkApiPattern.test(u));

console.log("--- Skipped breakdown ---");
console.log(`  SDK auto-generated API refs: ${sdkApi.length}`);
console.log(`  Other:                       ${otherSkip.length}`);
console.log();

// Break down "other" by section
const sections = {};
for (const u of otherSkip) {
  try {
    const pathname = new URL(u).pathname;
    const parts = pathname.split("/").filter(Boolean);
    const key = parts.slice(0, 3).join("/");
    sections[key] = (sections[key] || []);
    sections[key].push(u);
  } catch {
    sections["parse-error"] = sections["parse-error"] || [];
    sections["parse-error"].push(u);
  }
}

console.log("--- Other skipped by section ---");
const sorted = Object.entries(sections).sort((a, b) => b[1].length - a[1].length);
for (const [section, urls] of sorted) {
  console.log(`  ${section}: ${urls.length}`);
}

console.log();
console.log("--- Failed pages (errors) ---");
for (const e of r.errors) {
  console.log(`  ${e.url || e}`);
}

console.log();
console.log("--- Sample of other skipped (first 30) ---");
for (const u of otherSkip.slice(0, 30)) {
  console.log(`  ${u}`);
}
