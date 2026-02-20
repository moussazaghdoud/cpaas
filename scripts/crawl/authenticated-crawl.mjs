/**
 * Authenticated Crawler for developers.openrainbow.com
 * ====================================================
 * Logs in first, then crawls authenticated sections
 * (dashboard, applications, billing, store, etc.)
 * plus the ~200 SDK guide pages missed in the first crawl.
 */

import { chromium } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const RAW_DIR = path.join(ROOT, 'content/raw');
const REPORT_PATH = path.join(ROOT, 'content/auth-discovery-report.json');

const BASE_URL = 'https://developers.openrainbow.com';
const DELAY_MS = 1000;
const MAX_PAGES = 2000;
const TIMEOUT_MS = 30000;

// Load .env manually (no dotenv dependency)
async function loadEnv() {
  try {
    const envPath = path.join(ROOT, '.env');
    const content = await fs.readFile(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        process.env[key] = val;
      }
    }
  } catch {
    // .env not found, rely on existing env vars
  }
}

// Skip patterns: only skip non-content files
const SKIP_PATTERNS = [
  /\/static\/media\//,                        // PDF/media downloads
  /redoc-index\.html/,                        // ReDoc pages (we have OpenAPI specs already)
  /swagger\.json/,                            // Raw spec files
  /\.pdf$/,                                   // PDF files
  /\.zip$/,                                   // Zip files
  /\.png$/,                                   // Image files
  /\.xml$/,                                   // XML files
  /\.md$/,                                    // Raw markdown files on the server
  /\.cdx$/,                                   // CDX files
];

// Authenticated section seeds + missed SDK guide pages
const SEED_URLS = [
  // Authenticated sections
  '/',
  '/applications',
  '/apis',
  '/billing',
  '/store',
  '/pricing',
  '/licenses',
  '/oauth',
  // SDK guide pages (missed in first crawl)
  '/doc/sdk/node/lts/guides/Getting_Started',
  '/doc/sdk/node/lts/guides/CHANGELOG',
  '/doc/sdk/web/lts/guides/Getting_Started',
  '/doc/sdk/web/lts/guides/CHANGELOG',
  '/doc/sdk/android/lts/guides/Getting_Started',
  '/doc/sdk/android/lts/guides/CHANGELOG',
  '/doc/sdk/android/lts/guides/Conference',
  '/doc/sdk/android/lts/guides/Development_Kit',
  '/doc/sdk/ios/lts/guides/Getting_Started',
  '/doc/sdk/ios/lts/guides/CHANGELOG',
  '/doc/sdk/csharp/core/lts/guides/Getting_Started',
  '/doc/sdk/csharp/core/lts/guides/CHANGELOG',
  '/doc/sdk/reactnative/lts/guides/Getting_Started',
  '/doc/sdk/reactnative/lts/guides/CHANGELOG',
  '/doc/sdk/cli/Getting_Started',
  '/doc/sdk/s2s-starterkit-nodejs/guides/Getting_Started',
  // SDK landing pages (failed before due to timeout — retry)
  '/doc/sdk/node',
  '/doc/sdk/web',
  '/doc/sdk/android',
  '/doc/sdk/ios',
  '/doc/sdk/csharp',
  '/doc/sdk/reactnative',
  // REST docs
  '/doc/rest/Connecting_to_Rainbow',
  '/doc/rest/Getting_Started',
  '/doc/rest/changelog',
];

function normalizeUrl(urlStr) {
  try {
    const u = new URL(urlStr, BASE_URL);
    if (u.origin !== new URL(BASE_URL).origin) return null;
    u.hash = '';
    let p = u.pathname.replace(/\/+$/, '') || '/';
    u.searchParams.sort();
    return u.origin + p + (u.search || '');
  } catch {
    return null;
  }
}

function detectPageType(url) {
  const p = new URL(url).pathname.toLowerCase();
  if (p === '/' || p === '') return 'marketing';
  if (p.includes('/applications')) return 'portal-apps';
  if (p.includes('/billing')) return 'portal-billing';
  if (p.includes('/store')) return 'portal-store';
  if (p.includes('/pricing')) return 'portal-pricing';
  if (p.includes('/apis')) return 'portal-apis';
  if (p.includes('/licenses')) return 'portal-licenses';
  if (p.includes('/oauth')) return 'portal-oauth';
  if (p.includes('/doc/rest/api')) return 'api-reference';
  if (p.includes('/doc/sdk')) return 'sdk';
  if (p.includes('/doc/guide') || p.includes('/getting-started')) return 'guide';
  if (p.includes('/doc/hub')) return 'docs-hub';
  if (p.includes('/doc/faq')) return 'faq';
  if (p.includes('/doc/release') || p.includes('/changelog')) return 'changelog';
  if (p.includes('/doc/rest')) return 'rest-docs';
  if (p.includes('/doc/')) return 'documentation';
  return 'other';
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function login(context) {
  const email = process.env.RAINBOW_EMAIL;
  const password = process.env.RAINBOW_PASSWORD;

  if (!email || !password) {
    console.log('⚠️  No RAINBOW_EMAIL/RAINBOW_PASSWORD in .env — crawling without auth');
    return false;
  }

  console.log(`🔐 Logging in as ${email}...`);
  const page = await context.newPage();

  try {
    // Go directly to the login page
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: TIMEOUT_MS });
    await page.waitForTimeout(3000);

    // Dismiss cookie banner if present
    try {
      const btns = await page.$$('button');
      for (const btn of btns) {
        const text = (await btn.textContent() || '').toLowerCase();
        if (text.includes('continue') || text.includes('accept') || text.includes('ok')) {
          await btn.click();
          await page.waitForTimeout(1000);
          break;
        }
      }
    } catch { /* no cookie banner */ }

    // Fill email (#email input)
    await page.fill('#email', email);
    console.log('   Filled email');
    await page.waitForTimeout(500);

    // Fill password (#password input)
    await page.fill('#password', password);
    console.log('   Filled password');
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(ROOT, 'content/raw/login-01-filled.png') });

    // Click "S'IDENTIFIER" button
    const submitBtn = await page.$('button:has-text("IDENTIFIER")') ||
                      await page.$('button[type="submit"]') ||
                      await page.$('.btn-login');
    if (submitBtn) {
      console.log('   Clicking S\'IDENTIFIER...');
      await submitBtn.click();
    } else {
      console.log('   No submit button found, pressing Enter');
      await page.keyboard.press('Enter');
    }

    // Wait for login to complete (redirect or page change)
    await page.waitForTimeout(8000);
    await page.screenshot({ path: path.join(ROOT, 'content/raw/login-02-after.png') });

    const currentUrl = page.url();
    console.log(`   After login URL: ${currentUrl}`);

    // Check if login succeeded — look for user avatar, logout, or profile elements
    const isLoggedIn = await page.evaluate(() => {
      const body = document.body.textContent || '';
      // If still on login page with error, login failed
      if (document.querySelector('#email') && document.querySelector('#password')) {
        const errorEl = document.querySelector('.alert-danger, .error, [class*="error"]');
        if (errorEl) return { success: false, error: errorEl.textContent.trim() };
      }
      // Check for logged-in indicators
      const hasLogout = body.includes('Logout') || body.includes('Déconnexion') || body.includes('Se déconnecter');
      const hasAvatar = !!document.querySelector('[class*="avatar"], [class*="profile"], [class*="user-menu"]');
      const hasApps = body.includes('My Applications') || body.includes('Mes applications') || body.includes('applications');
      return { success: hasLogout || hasAvatar || hasApps || !document.querySelector('#password'), error: null };
    });

    if (isLoggedIn.error) {
      console.log(`   ❌ Login failed: ${isLoggedIn.error}`);
      await page.close();
      return false;
    }

    console.log(isLoggedIn.success ? '   ✅ Login successful!' : '   ⚠️  Login status unclear — continuing');
    await page.close();
    return true;
  } catch (e) {
    console.log(`   ❌ Login error: ${e.message}`);
    await page.screenshot({ path: path.join(ROOT, 'content/raw/login-error.png') }).catch(() => {});
    await page.close();
    return false;
  }
}

async function crawl() {
  await loadEnv();
  await fs.mkdir(RAW_DIR, { recursive: true });

  const visited = new Set();
  const queue = [];
  const results = [];
  const errors = [];

  // Load already-crawled URLs from previous runs to skip them
  let previouslyCrawled = 0;
  for (const reportFile of ['discovery-report.json', 'auth-discovery-report.json']) {
    try {
      const prevReport = JSON.parse(await fs.readFile(
        path.join(ROOT, 'content', reportFile), 'utf-8'
      ));
      for (const page of prevReport.pages || []) {
        const norm = normalizeUrl(page.url);
        if (norm) {
          visited.add(norm);
          previouslyCrawled++;
        }
      }
    } catch { /* no previous report */ }
  }
  console.log(`📋 Skipping ${previouslyCrawled} already-crawled pages`);

  // Seed queue from SEED_URLS
  for (const seed of SEED_URLS) {
    const norm = normalizeUrl(seed);
    if (norm && !visited.has(norm)) {
      visited.add(norm);
      queue.push(norm);
    }
  }

  // Also seed from previously-discovered-but-not-crawled URLs
  for (const reportFile of ['discovery-report.json', 'auth-discovery-report.json']) {
    try {
      const report = JSON.parse(await fs.readFile(
        path.join(ROOT, 'content', reportFile), 'utf-8'
      ));
      for (const url of report.allUrls || []) {
        const norm = normalizeUrl(url);
        if (norm && !visited.has(norm)) {
          const linkPath = new URL(norm).pathname;
          const shouldSkip = SKIP_PATTERNS.some(p => p.test(linkPath));
          if (!shouldSkip) {
            visited.add(norm);
            queue.push(norm);
          }
        }
      }
    } catch { /* no report */ }
  }
  console.log(`   Queue after seeding from reports: ${queue.length} URLs`);

  console.log(`\n🚀 Starting authenticated crawler on ${BASE_URL}`);
  console.log(`   Seeds: ${queue.length} URLs`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'RainbowCPaaS-Migrator/1.0 (content migration bot)',
    viewport: { width: 1440, height: 900 },
  });

  // Login
  const loggedIn = await login(context);
  console.log(loggedIn ? '🔓 Crawling with auth' : '🔒 Crawling without auth');

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

      await page.waitForTimeout(2000);

      // Extract page data
      const data = await page.evaluate(() => {
        const title = document.title || '';
        const h1 = document.querySelector('h1')?.textContent?.trim() || '';

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

        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => ({
          level: parseInt(h.tagName[1]),
          text: h.textContent?.trim() || '',
          id: h.id || '',
        }));

        const codeBlocks = Array.from(document.querySelectorAll('pre code, pre')).map(el => ({
          language: el.className?.match(/language-(\w+)/)?.[1] || '',
          code: el.textContent?.trim() || '',
        }));

        const allLinks = Array.from(document.querySelectorAll('a[href]'))
          .map(a => a.href)
          .filter(href => href.startsWith(window.location.origin));

        const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

        return { title, h1, headings, mainHtml, text: text.substring(0, 50000), codeBlocks, allLinks, metaDescription: metaDesc };
      });

      const fullHtml = await page.content();
      const pageType = detectPageType(url);

      const slug = (new URL(url).pathname || '/index')
        .replace(/^\//, '')
        .replace(/\//g, '__') || 'index';

      // Save raw HTML + JSON
      await fs.writeFile(path.join(RAW_DIR, `${slug}.html`), fullHtml, 'utf-8');
      await fs.writeFile(path.join(RAW_DIR, `${slug}.json`), JSON.stringify({
        url,
        path: new URL(url).pathname,
        title: data.title,
        h1: data.h1,
        pageType,
        headings: data.headings,
        textLength: data.text.length,
        codeBlockCount: data.codeBlocks.length,
        metaDescription: data.metaDescription,
        mainHtml: data.mainHtml,
        text: data.text,
        codeBlocks: data.codeBlocks,
      }, null, 2), 'utf-8');

      // Take screenshot for authenticated pages
      if (pageType.startsWith('portal-')) {
        await page.screenshot({
          path: path.join(RAW_DIR, `screenshot-${slug}.png`),
          fullPage: true,
        });
      }

      results.push({
        url,
        path: new URL(url).pathname,
        title: data.title,
        h1: data.h1,
        pageType,
        headingCount: data.headings.length,
        textLength: data.text.length,
        codeBlockCount: data.codeBlocks.length,
      });

      // Enqueue links
      for (const link of data.allLinks) {
        const norm = normalizeUrl(link);
        if (norm && !visited.has(norm)) {
          const linkPath = new URL(norm).pathname;
          const shouldSkip = SKIP_PATTERNS.some(p => p.test(linkPath));
          if (shouldSkip) {
            visited.add(norm);
            continue;
          }
          visited.add(norm);
          queue.push(norm);
        }
      }
    } catch (e) {
      errors.push({ url, error: e.message });
      console.log(`   ❌ ${e.message.substring(0, 100)}`);
    }

    await page.close();
    await delay(DELAY_MS);
  }

  await browser.close();

  // Report
  const pageTypes = {};
  for (const r of results) {
    pageTypes[r.pageType] = (pageTypes[r.pageType] || 0) + 1;
  }

  const report = {
    summary: {
      totalUrlsDiscovered: visited.size,
      totalPagesCrawled: results.length,
      totalErrors: errors.length,
      pageTypes,
      crawledAt: new Date().toISOString(),
    },
    pages: results.sort((a, b) => a.path.localeCompare(b.path)),
    errors,
    allUrls: Array.from(visited).sort(),
  };

  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('📊 AUTHENTICATED CRAWL REPORT');
  console.log('='.repeat(60));
  console.log(`URLs discovered: ${visited.size}`);
  console.log(`Pages crawled: ${results.length}`);
  console.log(`Errors: ${errors.length}`);
  console.log('\nBy type:');
  for (const [type, count] of Object.entries(pageTypes).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }
  if (errors.length > 0) {
    console.log('\nErrors:');
    for (const e of errors) {
      console.log(`  ❌ ${new URL(e.url).pathname}: ${e.error?.substring(0, 80)}`);
    }
  }
  console.log(`\nReport: ${REPORT_PATH}`);
}

crawl().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
