/**
 * Test script to discover the login flow on developers.openrainbow.com
 */
import { chromium } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const SHOTS = path.join(ROOT, 'content/raw');

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

const browser = await chromium.launch({ headless: false }); // visible for debugging
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

console.log('1. Loading homepage...');
await page.goto('https://developers.openrainbow.com', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);

// Dismiss cookie banner if present
console.log('2. Looking for cookie banner...');
const cookieBtns = await page.$$('button');
for (const btn of cookieBtns) {
  const text = (await btn.textContent() || '').toLowerCase();
  if (text.includes('accept') || text.includes('continuer') || text.includes('continue') || text.includes('agree') || text.includes('ok')) {
    console.log(`   Clicking cookie button: "${text.trim()}"`);
    await btn.click();
    await page.waitForTimeout(1000);
    break;
  }
}

await page.screenshot({ path: path.join(SHOTS, 'test-01-home.png') });

// List ALL links in the top header area
console.log('\n3. Scanning all links on page...');
const links = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('a')).map(a => ({
    text: a.textContent?.trim().substring(0, 60),
    href: a.href,
    rect: a.getBoundingClientRect(),
    classes: a.className,
    visible: a.offsetParent !== null,
  })).filter(l => {
    // Focus on top area (header) - y < 100px
    return l.rect.y < 100 || l.text.toLowerCase().includes('login') || l.text.toLowerCase().includes('sign') || l.text.toLowerCase().includes('connexion') || l.href.includes('login');
  });
});

console.log('   Top links and login-related:');
for (const l of links) {
  console.log(`   "${l.text}" -> ${l.href} (y=${Math.round(l.rect.y)}, visible=${l.visible})`);
}

// Also check for buttons in header
const headerBtns = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('button, [role="button"]')).map(b => ({
    text: b.textContent?.trim().substring(0, 60),
    rect: b.getBoundingClientRect(),
    classes: b.className,
    visible: b.offsetParent !== null,
  })).filter(b => b.rect.y < 100);
});

console.log('\n   Top buttons:');
for (const b of headerBtns) {
  console.log(`   "${b.text}" class="${b.classes}" (y=${Math.round(b.rect.y)})`);
}

// Look at the nav/header structure
const headerHtml = await page.evaluate(() => {
  const header = document.querySelector('header') || document.querySelector('nav') || document.querySelector('.navbar');
  if (header) return header.innerHTML.substring(0, 2000);
  // Try top-level divs
  const topDivs = Array.from(document.querySelectorAll('body > div')).slice(0, 3);
  return topDivs.map(d => d.innerHTML.substring(0, 500)).join('\n---\n');
});
console.log('\n4. Header HTML (first 1500 chars):');
console.log(headerHtml?.substring(0, 1500));

// Now try to find and click the actual login
console.log('\n5. Trying to navigate to login page...');

// Check if there's an icon-based login (person icon)
const iconLinks = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('a, button')).filter(el => {
    const rect = el.getBoundingClientRect();
    // Top-right corner
    return rect.y < 80 && rect.x > 1200;
  }).map(el => ({
    tag: el.tagName,
    text: el.textContent?.trim().substring(0, 40),
    href: el.getAttribute('href'),
    classes: el.className,
    x: Math.round(el.getBoundingClientRect().x),
    y: Math.round(el.getBoundingClientRect().y),
  }));
});

console.log('   Top-right elements:');
for (const el of iconLinks) {
  console.log(`   <${el.tag}> "${el.text}" href=${el.href} class="${el.classes}" (${el.x},${el.y})`);
}

// Click the first top-right interactive element
if (iconLinks.length > 0) {
  const target = iconLinks[0];
  console.log(`\n6. Clicking top-right element: "${target.text}"...`);
  if (target.href) {
    await page.goto(target.href.startsWith('http') ? target.href : 'https://developers.openrainbow.com' + target.href, { waitUntil: 'networkidle', timeout: 15000 });
  } else {
    await page.click(`${target.tag}.${target.classes.split(' ')[0]}`);
  }
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SHOTS, 'test-02-after-click.png') });
  console.log(`   Current URL: ${page.url()}`);
}

// Final: show the page URL and HTML for any login form
const finalUrl = page.url();
const hasForm = await page.evaluate(() => {
  const inputs = Array.from(document.querySelectorAll('input'));
  return inputs.map(i => ({ type: i.type, name: i.name, placeholder: i.placeholder, id: i.id }));
});
console.log(`\n7. Final state:`);
console.log(`   URL: ${finalUrl}`);
console.log(`   Inputs on page:`, JSON.stringify(hasForm, null, 2));

await page.screenshot({ path: path.join(SHOTS, 'test-03-final.png') });

await browser.close();
console.log('\nDone. Check screenshots in content/raw/test-*.png');
