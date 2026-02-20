/**
 * Final targeted crawl — only the 41 missing useful pages
 */
import { chromium } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const RAW_DIR = path.join(ROOT, 'content/raw');
const REPORT_PATH = path.join(ROOT, 'content/final-crawl-report.json');
const BASE_URL = 'https://developers.openrainbow.com';
const TIMEOUT_MS = 30000;
const DELAY_MS = 1500;

// Load .env
try {
  const env = await fs.readFile(path.join(ROOT, '.env'), 'utf-8');
  for (const line of env.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq > 0) process.env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
} catch {}

// Only the useful missing pages
const TARGETS = [
  // React Native tutorials
  '/doc/sdk/reactnative/tutorials/BubbleCustomData',
  '/doc/sdk/reactnative/tutorials/BubbleParticipants',
  '/doc/sdk/reactnative/tutorials/BubbleServices',
  '/doc/sdk/reactnative/tutorials/BubblesComponent',
  '/doc/sdk/reactnative/tutorials/CurrentCallServices',
  '/doc/sdk/reactnative/tutorials/bubbles',
  '/doc/sdk/reactnative/tutorials/commonComponents',
  '/doc/sdk/reactnative/tutorials/enable_push_notifications',
  '/doc/sdk/reactnative/tutorials/getting_started',
  '/doc/sdk/reactnative/tutorials/im_conversation',
  '/doc/sdk/reactnative/tutorials/invitations',
  '/doc/sdk/reactnative/tutorials/login',
  '/doc/sdk/reactnative/tutorials/p2p_calls',
  '/doc/sdk/reactnative/tutorials/presence',
  '/doc/sdk/reactnative/tutorials/searchRainbow',
  // Web v2 guides
  '/doc/sdk/webv2/lts/guides/core/conversations/conversations',
  '/doc/sdk/webv2/lts/guides/core/users/users',
  '/doc/sdk/webv2/lts/guides/migration/migration',
  '/doc/sdk/webv2/lts/guides/plugins/bubbles/bubbles',
  // Android guides
  '/doc/sdk/android/lts/guides/Managing_personal_profile',
  // iOS guides
  '/doc/sdk/ios/lts/guides/Conference_V2_migration',
  '/doc/sdk/ios/lts/guides/Contacts',
  // Web SDK guides
  '/doc/sdk/web/lts/guides/Loading_Angular_Ax_applications',
  '/doc/sdk/web/lts/guides/Sending_notifications',
  // Node SDK
  '/doc/sdk/node/lts/guides/What_is_new',
  '/doc/sdk/node/lts/guides/Managing_conferences',
];

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
  await fs.mkdir(RAW_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'RainbowCPaaS-Migrator/1.0',
    viewport: { width: 1440, height: 900 },
  });

  // Login
  console.log('Logging in...');
  const loginPage = await context.newPage();
  await loginPage.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: TIMEOUT_MS });
  await loginPage.waitForTimeout(2000);
  try {
    const btns = await loginPage.$$('button');
    for (const btn of btns) {
      const text = (await btn.textContent() || '').toLowerCase();
      if (text.includes('continue') || text.includes('accept')) { await btn.click(); break; }
    }
  } catch {}
  await loginPage.fill('#email', process.env.RAINBOW_EMAIL || '');
  await loginPage.fill('#password', process.env.RAINBOW_PASSWORD || '');
  const submitBtn = await loginPage.$('button:has-text("IDENTIFIER")') || await loginPage.$('button[type="submit"]');
  if (submitBtn) await submitBtn.click();
  await loginPage.waitForTimeout(5000);
  console.log('Login URL: ' + loginPage.url());
  await loginPage.close();

  const results = [];
  const errors = [];

  for (let i = 0; i < TARGETS.length; i++) {
    const urlPath = TARGETS[i];
    const url = BASE_URL + urlPath;
    console.log(`[${i + 1}/${TARGETS.length}] ${urlPath}`);

    const page = await context.newPage();
    try {
      const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: TIMEOUT_MS });
      if (!resp || resp.status() >= 400) {
        errors.push({ url, error: 'HTTP ' + (resp?.status() || 0) });
        await page.close();
        await delay(DELAY_MS);
        continue;
      }
      await page.waitForTimeout(2000);

      const data = await page.evaluate(() => {
        const title = document.title || '';
        const h1 = document.querySelector('h1')?.textContent?.trim() || '';
        const mainSelectors = ['main', 'article', '[role="main"]', '.content', '.doc-content', '#content'];
        let mainEl = null;
        for (const sel of mainSelectors) { mainEl = document.querySelector(sel); if (mainEl) break; }
        if (!mainEl) mainEl = document.body;
        const mainHtml = mainEl.innerHTML;
        const text = mainEl.textContent?.replace(/\s+/g, ' ').trim() || '';
        const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4')).map(h => ({
          level: parseInt(h.tagName[1]), text: h.textContent?.trim() || '', id: h.id || '',
        }));
        const codeBlocks = Array.from(document.querySelectorAll('pre code, pre')).map(el => ({
          language: el.className?.match(/language-(\w+)/)?.[1] || '',
          code: el.textContent?.trim() || '',
        }));
        const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        return { title, h1, headings, mainHtml, text: text.substring(0, 50000), codeBlocks, metaDescription: metaDesc };
      });

      const fullHtml = await page.content();
      const slug = urlPath.replace(/^\//, '').replace(/\//g, '__');

      await fs.writeFile(path.join(RAW_DIR, `${slug}.html`), fullHtml, 'utf-8');
      await fs.writeFile(path.join(RAW_DIR, `${slug}.json`), JSON.stringify({
        url, path: urlPath, title: data.title, h1: data.h1,
        pageType: 'sdk', headings: data.headings,
        textLength: data.text.length, codeBlockCount: data.codeBlocks.length,
        metaDescription: data.metaDescription,
        mainHtml: data.mainHtml, text: data.text, codeBlocks: data.codeBlocks,
      }, null, 2), 'utf-8');

      results.push({ url, path: urlPath, title: data.title, h1: data.h1, textLength: data.text.length });
      console.log(`   OK: "${data.h1 || data.title}" (${data.text.length} chars)`);
    } catch (e) {
      errors.push({ url, error: e.message.substring(0, 100) });
      console.log(`   ERR: ${e.message.substring(0, 80)}`);
    }
    await page.close();
    await delay(DELAY_MS);
  }

  await browser.close();

  const report = { pages: results, errors, crawledAt: new Date().toISOString() };
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log(`\nDone: ${results.length} OK, ${errors.length} errors`);
}

run().catch(e => { console.error(e); process.exit(1); });
