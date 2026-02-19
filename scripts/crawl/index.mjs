/**
 * Rainbow CPaaS Developer Portal Crawler
 * =======================================
 * Playwright-based polite crawler for developers.openrainbow.com
 * Discovers all pages, extracts content, detects page types,
 * downloads OpenAPI specs, and generates a discovery report.
 */

import { chromium } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const RAW_DIR = path.join(ROOT, 'content/raw');
const OPENAPI_DIR = path.join(ROOT, 'content/openapi');
const REPORT_PATH = path.join(ROOT, 'content/discovery-report.json');

const BASE_URL = 'https://developers.openrainbow.com';
const CONCURRENCY = 1; // polite: one page at a time
const DELAY_MS = 1000; // delay between requests
const MAX_PAGES = 300; // safety limit
const TIMEOUT_MS = 30000;

// Skip patterns: auto-generated SDK API reference pages (hundreds per SDK)
// We'll crawl the SDK landing + guides but skip individual class/method pages
const SKIP_PATTERNS = [
  /\/doc\/sdk\/[^/]+\/[^/]+\/[^/]+\/api\//,  // Any SDK deep API reference page
  /\/static\/media\//,                         // PDF/media downloads
];

// Known seed URLs to ensure we don't miss major sections
const SEED_URLS = [
  '/',
  '/doc/hub',
  '/doc/sdk/node',
  '/doc/sdk/web',
  '/doc/sdk/android',
  '/doc/sdk/ios',
  '/doc/sdk/csharp',
  '/doc/rest/api',
  '/doc/guides',
  '/doc/faq',
  '/doc/release-notes',
  '/support',
  '/legal',
];

/** Normalize URL: strip hash, trailing slash, query params for dedup */
function normalizeUrl(urlStr) {
  try {
    const u = new URL(urlStr, BASE_URL);
    if (u.origin !== new URL(BASE_URL).origin) return null;
    // Remove hash
    u.hash = '';
    // Keep path, remove trailing slash (except root)
    let p = u.pathname.replace(/\/+$/, '') || '/';
    // Sort query params for consistency
    u.searchParams.sort();
    return u.origin + p + (u.search || '');
  } catch {
    return null;
  }
}

/** Detect page type from URL and content hints */
function detectPageType(url, title, mainText) {
  const p = new URL(url).pathname.toLowerCase();
  if (p === '/' || p === '') return 'marketing';
  if (p.includes('/doc/rest/api') || p.includes('/doc/api') || p.includes('redoc')) return 'api-reference';
  if (p.includes('/doc/sdk')) return 'sdk';
  if (p.includes('/doc/guide') || p.includes('/getting-started') || p.includes('/quickstart')) return 'guide';
  if (p.includes('/doc/hub')) return 'docs-hub';
  if (p.includes('/doc/faq') || p.includes('/faq')) return 'faq';
  if (p.includes('/doc/release') || p.includes('/changelog')) return 'changelog';
  if (p.includes('/legal') || p.includes('/terms') || p.includes('/agreement') || p.includes('/privacy')) return 'legal';
  if (p.includes('/support') || p.includes('/contact')) return 'support';
  if (p.includes('/doc/')) return 'documentation';
  return 'other';
}

/** Wait helper */
const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function crawl() {
  await fs.mkdir(RAW_DIR, { recursive: true });
  await fs.mkdir(OPENAPI_DIR, { recursive: true });

  const visited = new Set();
  const queue = [];
  const results = [];
  const errors = [];
  const openApiSpecs = [];

  // Seed the queue
  for (const seed of SEED_URLS) {
    const norm = normalizeUrl(seed);
    if (norm && !visited.has(norm)) {
      visited.add(norm);
      queue.push(norm);
    }
  }

  console.log(`🚀 Starting crawler on ${BASE_URL}`);
  console.log(`   Seeds: ${queue.length} URLs`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'RainbowCPaaS-Migrator/1.0 (content migration bot)',
    viewport: { width: 1440, height: 900 },
  });

  let pageCount = 0;

  while (queue.length > 0 && pageCount < MAX_PAGES) {
    const url = queue.shift();
    pageCount++;
    const shortUrl = url.replace(BASE_URL, '');
    console.log(`[${pageCount}/${pageCount + queue.length}] ${shortUrl || '/'}`);

    const page = await context.newPage();
    try {
      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: TIMEOUT_MS,
      });

      if (!response || response.status() >= 400) {
        errors.push({ url, status: response?.status() || 0, error: 'HTTP error' });
        await page.close();
        await delay(DELAY_MS);
        continue;
      }

      // Wait for content to render (SPAs)
      await page.waitForTimeout(2000);

      // Extract page data
      const data = await page.evaluate(() => {
        const title = document.title || '';
        const h1 = document.querySelector('h1')?.textContent?.trim() || '';
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => ({
          level: parseInt(h.tagName[1]),
          text: h.textContent?.trim() || '',
          id: h.id || '',
        }));

        // Try to find the main content area
        const mainSelectors = [
          'main', 'article', '[role="main"]',
          '.content', '.doc-content', '.markdown-body',
          '#content', '#main-content',
          '.container main', '.page-content',
        ];
        let mainEl = null;
        for (const sel of mainSelectors) {
          mainEl = document.querySelector(sel);
          if (mainEl) break;
        }
        if (!mainEl) mainEl = document.body;

        const mainHtml = mainEl.innerHTML;
        const text = mainEl.textContent?.replace(/\s+/g, ' ').trim() || '';

        // Extract code blocks
        const codeBlocks = Array.from(document.querySelectorAll('pre code, pre')).map(el => ({
          language: el.className?.match(/language-(\w+)/)?.[1] || '',
          code: el.textContent?.trim() || '',
        }));

        // Extract nav links
        const navLinks = Array.from(document.querySelectorAll('nav a, aside a, .sidebar a')).map(a => ({
          text: a.textContent?.trim() || '',
          href: a.href,
        }));

        // All internal links on the page
        const allLinks = Array.from(document.querySelectorAll('a[href]'))
          .map(a => a.href)
          .filter(href => href.startsWith(window.location.origin));

        // Check for OpenAPI/ReDoc indicators
        const hasRedoc = !!document.querySelector('redoc, [id*="redoc"], .redoc');
        const openApiLink = Array.from(document.querySelectorAll('a'))
          .find(a => a.textContent?.toLowerCase().includes('download') &&
                     (a.href?.includes('.json') || a.href?.includes('.yaml') || a.href?.includes('openapi')));

        // Meta description
        const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

        return {
          title,
          h1,
          headings,
          mainHtml,
          text: text.substring(0, 50000), // cap text size
          codeBlocks,
          navLinks,
          allLinks,
          hasRedoc,
          openApiLink: openApiLink?.href || null,
          metaDescription: metaDesc,
        };
      });

      const fullHtml = await page.content();
      const pageType = detectPageType(url, data.title, data.text);

      // Save raw HTML
      const slug = (new URL(url).pathname || '/index')
        .replace(/^\//, '')
        .replace(/\//g, '__') || 'index';
      await fs.writeFile(
        path.join(RAW_DIR, `${slug}.html`),
        fullHtml,
        'utf-8'
      );

      // Record result
      const record = {
        url,
        path: new URL(url).pathname,
        title: data.title,
        h1: data.h1,
        pageType,
        headingCount: data.headings.length,
        headings: data.headings.slice(0, 20),
        textLength: data.text.length,
        codeBlockCount: data.codeBlocks.length,
        hasRedoc: data.hasRedoc,
        openApiLink: data.openApiLink,
        metaDescription: data.metaDescription,
        navLinksCount: data.navLinks.length,
        lastFetchedAt: new Date().toISOString(),
      };
      results.push(record);

      // Save extracted content JSON
      await fs.writeFile(
        path.join(RAW_DIR, `${slug}.json`),
        JSON.stringify({
          ...record,
          mainHtml: data.mainHtml,
          text: data.text,
          codeBlocks: data.codeBlocks,
          navLinks: data.navLinks,
        }, null, 2),
        'utf-8'
      );

      // Download OpenAPI spec if found
      if (data.openApiLink) {
        try {
          console.log(`   📋 Found OpenAPI spec: ${data.openApiLink}`);
          const specPage = await context.newPage();
          const specResp = await specPage.goto(data.openApiLink, { timeout: 15000 });
          if (specResp && specResp.ok()) {
            const specBody = await specResp.text();
            const specName = slug.replace(/__/g, '-') || 'api';
            const ext = data.openApiLink.includes('.yaml') ? '.yaml' : '.json';
            await fs.writeFile(
              path.join(OPENAPI_DIR, `${specName}${ext}`),
              specBody,
              'utf-8'
            );
            openApiSpecs.push({ name: specName, url: data.openApiLink, savedAs: `${specName}${ext}` });
          }
          await specPage.close();
        } catch (e) {
          console.log(`   ⚠️  Failed to download OpenAPI spec: ${e.message}`);
        }
      }

      // Enqueue discovered links (skip deep SDK API ref pages)
      for (const link of data.allLinks) {
        const norm = normalizeUrl(link);
        if (norm && !visited.has(norm)) {
          const linkPath = new URL(norm).pathname;
          const shouldSkip = SKIP_PATTERNS.some(p => p.test(linkPath));
          if (shouldSkip) {
            // Record as discovered but don't crawl
            visited.add(norm);
            continue;
          }
          visited.add(norm);
          queue.push(norm);
        }
      }

    } catch (e) {
      errors.push({ url, error: e.message });
      console.log(`   ❌ Error: ${e.message.substring(0, 100)}`);
    }

    await page.close();
    await delay(DELAY_MS);
  }

  await browser.close();

  // Generate discovery report
  const pageTypes = {};
  for (const r of results) {
    pageTypes[r.pageType] = (pageTypes[r.pageType] || 0) + 1;
  }

  const report = {
    summary: {
      totalPagesDiscovered: visited.size,
      totalPagesCrawled: results.length,
      totalErrors: errors.length,
      openApiSpecsFound: openApiSpecs.length,
      pageTypes,
      crawledAt: new Date().toISOString(),
    },
    pages: results.sort((a, b) => a.path.localeCompare(b.path)),
    errors,
    openApiSpecs,
    allUrls: Array.from(visited).sort(),
  };

  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8');

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 DISCOVERY REPORT');
  console.log('='.repeat(60));
  console.log(`Total URLs discovered: ${visited.size}`);
  console.log(`Pages successfully crawled: ${results.length}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`OpenAPI specs found: ${openApiSpecs.length}`);
  console.log('\nPage types:');
  for (const [type, count] of Object.entries(pageTypes).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }
  console.log('\nAll discovered paths:');
  for (const url of Array.from(visited).sort()) {
    const p = new URL(url).pathname;
    const r = results.find(x => x.url === url);
    console.log(`  ${r ? '✅' : '⏳'} ${p} ${r ? `[${r.pageType}]` : ''}`);
  }
  if (errors.length > 0) {
    console.log('\nErrors:');
    for (const e of errors) {
      console.log(`  ❌ ${new URL(e.url).pathname}: ${e.error}`);
    }
  }
  if (openApiSpecs.length > 0) {
    console.log('\nOpenAPI specs:');
    for (const s of openApiSpecs) {
      console.log(`  📋 ${s.name} -> ${s.savedAs}`);
    }
  }
  console.log(`\nReport saved to: ${REPORT_PATH}`);
  return report;
}

crawl().catch(e => {
  console.error('Fatal crawler error:', e);
  process.exit(1);
});
