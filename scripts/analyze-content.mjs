import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Load all discovered URLs from both reports
const allUrls = new Set();
const crawledUrls = new Set();

for (const file of ['content/discovery-report.json', 'content/auth-discovery-report.json']) {
  try {
    const report = JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf-8'));
    for (const u of report.allUrls || []) allUrls.add(u);
    for (const p of report.pages || []) crawledUrls.add(p.url);
  } catch {}
}

// Classify every URL
const categories = {
  'CRAWLED - Hub docs & guides': [],
  'CRAWLED - SDK guides (tutorials)': [],
  'CRAWLED - SDK API reference (service-level)': [],
  'CRAWLED - Portal (authenticated)': [],
  'CRAWLED - REST docs': [],
  'CRAWLED - Other': [],
  'MISSING - SDK guides (useful)': [],
  'MISSING - React Native tutorials (useful)': [],
  'MISSING - Web v2 guides (useful)': [],
  'SKIP - Android KDoc per-class/enum pages': [],
  'SKIP - C# auto-generated per-class API': [],
  'SKIP - C# Previous (deprecated SDK)': [],
  'SKIP - Web v2 TypeDoc per-interface/enum': [],
  'SKIP - ReDoc / Swagger (already have OpenAPI)': [],
  'SKIP - PDFs / media / zip / images': [],
  'SKIP - Broken / template URLs': [],
  'SKIP - Redirect shortcut URLs': [],
  'REVIEW - Other uncategorized': [],
};

for (const url of allUrls) {
  const p = new URL(url).pathname;
  const isCrawled = crawledUrls.has(url);

  // Broken / template URLs
  if (p.includes('%7B%7B') || p.includes('(http') || p.includes('(/doc')) {
    categories['SKIP - Broken / template URLs'].push(p);
    continue;
  }
  // PDFs, media, images
  if (/\.(pdf|zip|png|svg|xml|md|cdx)$/i.test(p) || p.includes('/static/media/')) {
    categories['SKIP - PDFs / media / zip / images'].push(p);
    continue;
  }
  // ReDoc / Swagger
  if (p.includes('redoc-index') || p.includes('swagger.json')) {
    categories['SKIP - ReDoc / Swagger (already have OpenAPI)'].push(p);
    continue;
  }
  // C# Previous (deprecated)
  if (p.includes('/csharpprevious/') && p.includes('/api/')) {
    categories['SKIP - C# Previous (deprecated SDK)'].push(p);
    continue;
  }
  // Android KDoc per-class pages (have /modules/ or /objects/ in path with deep nesting)
  if (p.includes('/doc/sdk/android/lts/modules/') || p.includes('/doc/sdk/android/lts/objects/')) {
    categories['SKIP - Android KDoc per-class/enum pages'].push(p);
    continue;
  }
  // C# auto-generated API (Rainbow.Something pattern)
  if (/\/doc\/sdk\/csharp\/[^/]+\/lts\/api\/Rainbow\./.test(p)) {
    categories['SKIP - C# auto-generated per-class API'].push(p);
    continue;
  }
  // Web v2 TypeDoc individual pages (interfaces, enumerations, classes, type-aliases, variables)
  if (/\/doc\/sdk\/webv2\/lts\/api\/[^/]+\/(interfaces|enumerations|classes|type-aliases|variables)\//.test(p)) {
    categories['SKIP - Web v2 TypeDoc per-interface/enum'].push(p);
    continue;
  }
  // Redirect shortcut URLs (bare /android, /node, /web, /ios, /csharp, etc.)
  if (/^\/(android|ios|node|web|csharp|reactnative|enduser|customercare|login|logout)$/.test(p)) {
    categories['SKIP - Redirect shortcut URLs'].push(p);
    continue;
  }

  if (isCrawled) {
    if (p.includes('/doc/hub/') || p === '/doc/hub') {
      categories['CRAWLED - Hub docs & guides'].push(p);
    } else if (/\/doc\/sdk\/.*\/guides\//.test(p) || /\/doc\/sdk\/.*\/tutorials\//.test(p)) {
      categories['CRAWLED - SDK guides (tutorials)'].push(p);
    } else if (/\/doc\/sdk\/.*\/api\//.test(p) || /\/doc\/sdk\/.*\/home/.test(p)) {
      categories['CRAWLED - SDK API reference (service-level)'].push(p);
    } else if (/^\/(dashboard|applications|billing|store|pricing|licenses|profile|sandbox|oauth|apis|home)/.test(p)) {
      categories['CRAWLED - Portal (authenticated)'].push(p);
    } else if (p.includes('/doc/rest/')) {
      categories['CRAWLED - REST docs'].push(p);
    } else {
      categories['CRAWLED - Other'].push(p);
    }
  } else {
    // Not yet crawled
    if (/\/doc\/sdk\/.*\/guides\//.test(p) || /\/doc\/sdk\/.*\/tutorials\//.test(p)) {
      if (p.includes('/reactnative/')) {
        categories['MISSING - React Native tutorials (useful)'].push(p);
      } else if (p.includes('/webv2/')) {
        categories['MISSING - Web v2 guides (useful)'].push(p);
      } else {
        categories['MISSING - SDK guides (useful)'].push(p);
      }
    } else if (/\/api\/admin\/|\/api\/authentication\//.test(p)) {
      categories['SKIP - ReDoc / Swagger (already have OpenAPI)'].push(p);
    } else {
      categories['REVIEW - Other uncategorized'].push(p);
    }
  }
}

// Print summary
console.log('=== CONTENT AUDIT ===\n');
let totalCrawled = 0, totalSkip = 0, totalMissing = 0, totalReview = 0;

for (const [cat, urls] of Object.entries(categories)) {
  if (urls.length === 0) continue;
  console.log(`${cat}: ${urls.length}`);
  if (cat.startsWith('MISSING') || cat.startsWith('REVIEW')) {
    for (const u of urls.slice(0, 8)) console.log(`  ${u}`);
    if (urls.length > 8) console.log(`  ... +${urls.length - 8} more`);
  }
  if (cat.startsWith('CRAWLED')) totalCrawled += urls.length;
  if (cat.startsWith('SKIP')) totalSkip += urls.length;
  if (cat.startsWith('MISSING')) totalMissing += urls.length;
  if (cat.startsWith('REVIEW')) totalReview += urls.length;
  console.log();
}

console.log('--- SUMMARY ---');
console.log(`Already crawled:    ${totalCrawled}`);
console.log(`Should skip:        ${totalSkip}`);
console.log(`Missing (useful):   ${totalMissing}`);
console.log(`Needs review:       ${totalReview}`);
console.log(`Total:              ${allUrls.size}`);
