/**
 * Rainbow CPaaS Content Transformer
 * ==================================
 * Transforms crawled HTML content into clean MDX files
 * and builds a search index for the new site.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import TurndownService from 'turndown';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const RAW_DIR = path.join(ROOT, 'content/raw');
const MDX_DIR = path.join(ROOT, 'content/mdx');
const SEARCH_DIR = path.join(ROOT, 'content/search-index');
const REPORT_PATH = path.join(ROOT, 'content/discovery-report.json');
const REDIRECTS_PATH = path.join(ROOT, 'content/redirects.json');

// Route mapping: old paths -> new paths
function mapRoute(oldPath) {
  if (oldPath === '/' || oldPath === '') return '/';
  if (oldPath === '/doc/hub') return '/docs';
  if (oldPath.startsWith('/doc/sdk/node')) return '/docs/sdk/node';
  if (oldPath.startsWith('/doc/sdk/web')) return '/docs/sdk/web';
  if (oldPath.startsWith('/doc/sdk/android')) return '/docs/sdk/android';
  if (oldPath.startsWith('/doc/sdk/ios')) return '/docs/sdk/ios';
  if (oldPath.startsWith('/doc/sdk/csharp')) return '/docs/sdk/csharp';
  if (oldPath.startsWith('/doc/rest/api')) return '/api-reference';
  if (oldPath.startsWith('/doc/guide')) return '/docs/guides';
  if (oldPath === '/doc/faq') return '/docs/faq';
  if (oldPath.startsWith('/doc/release')) return '/changelog';
  if (oldPath.startsWith('/support')) return '/support';
  if (oldPath.startsWith('/legal')) return '/legal';
  if (oldPath.startsWith('/doc/')) {
    // Generic docs mapping
    const rest = oldPath.replace('/doc/', '');
    return `/docs/${rest}`;
  }
  return oldPath;
}

// Detect callout/note patterns in HTML and convert
function processCallouts(html) {
  // Common patterns: divs with note/warning/tip classes
  const calloutPatterns = [
    { regex: /<div[^>]*class="[^"]*(?:note|info)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, type: 'note' },
    { regex: /<div[^>]*class="[^"]*warning[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, type: 'warning' },
    { regex: /<div[^>]*class="[^"]*tip[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, type: 'tip' },
    { regex: /<div[^>]*class="[^"]*danger[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, type: 'danger' },
  ];

  for (const { regex, type } of calloutPatterns) {
    html = html.replace(regex, (_, content) => {
      return `<callout type="${type}">${content}</callout>`;
    });
  }
  return html;
}

// Configure Turndown for MDX conversion
function createTurndown() {
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    hr: '---',
    strongDelimiter: '**',
    emDelimiter: '*',
  });

  // Preserve code block language
  td.addRule('codeBlock', {
    filter: (node) => node.nodeName === 'PRE',
    replacement: (content, node) => {
      const codeEl = node.querySelector ? node.querySelector('code') : null;
      let lang = '';
      if (codeEl) {
        const cls = codeEl.getAttribute ? codeEl.getAttribute('class') : '';
        const match = (cls || '').match(/language-(\w+)/);
        if (match) lang = match[1];
        content = codeEl.textContent || content;
      }
      return `\n\`\`\`${lang}\n${content.trim()}\n\`\`\`\n`;
    },
  });

  // Convert callout markers to MDX components
  td.addRule('callout', {
    filter: (node) => node.nodeName === 'CALLOUT',
    replacement: (content, node) => {
      const type = node.getAttribute ? node.getAttribute('type') || 'note' : 'note';
      return `\n<Callout type="${type}">\n${content.trim()}\n</Callout>\n`;
    },
  });

  // Skip nav, header, footer, sidebar elements
  td.addRule('skipNav', {
    filter: (node) => {
      const tag = node.nodeName?.toLowerCase();
      return ['nav', 'header', 'footer'].includes(tag);
    },
    replacement: () => '',
  });

  return td;
}

// Rewrite internal links to new routes
function rewriteLinks(mdx) {
  // Match markdown links: [text](url)
  return mdx.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (match, text, url) => {
    if (url.startsWith('http') && !url.includes('developers.openrainbow.com')) {
      return match; // External link, keep as-is
    }
    if (url.startsWith('http') && url.includes('developers.openrainbow.com')) {
      try {
        const parsed = new URL(url);
        const newPath = mapRoute(parsed.pathname);
        return `[${text}](${newPath})`;
      } catch {
        return match;
      }
    }
    if (url.startsWith('/') || url.startsWith('#')) {
      const newPath = url.startsWith('#') ? url : mapRoute(url.split('#')[0]) + (url.includes('#') ? '#' + url.split('#')[1] : '');
      return `[${text}](${newPath})`;
    }
    return match;
  });
}

async function transform() {
  await fs.mkdir(MDX_DIR, { recursive: true });
  await fs.mkdir(SEARCH_DIR, { recursive: true });

  // Load discovery report
  let report;
  try {
    report = JSON.parse(await fs.readFile(REPORT_PATH, 'utf-8'));
  } catch (e) {
    console.error('❌ Discovery report not found. Run the crawler first: npm run crawl');
    process.exit(1);
  }

  console.log(`📄 Transforming ${report.pages.length} pages...`);

  const td = createTurndown();
  const searchDocs = [];
  const redirects = [];
  const stats = { success: 0, skipped: 0, errors: 0 };

  for (const page of report.pages) {
    const slug = (page.path || '/index')
      .replace(/^\//, '')
      .replace(/\//g, '__') || 'index';

    const jsonPath = path.join(RAW_DIR, `${slug}.json`);

    try {
      const raw = JSON.parse(await fs.readFile(jsonPath, 'utf-8'));

      // Skip pages with very little content
      if (!raw.mainHtml || raw.textLength < 50) {
        stats.skipped++;
        continue;
      }

      // Process HTML
      let html = processCallouts(raw.mainHtml);

      // Use cheerio to clean up HTML before conversion
      const $ = cheerio.load(html);
      // Remove script, style, svg elements
      $('script, style, svg, iframe').remove();
      // Remove empty paragraphs
      $('p:empty').remove();
      html = $.html();

      // Convert to MDX
      let mdx = td.turndown(html);

      // Rewrite internal links
      mdx = rewriteLinks(mdx);

      // Clean up excessive whitespace
      mdx = mdx.replace(/\n{4,}/g, '\n\n\n');

      // Build frontmatter
      const newPath = mapRoute(page.path);
      const frontmatter = [
        '---',
        `title: "${(page.title || page.h1 || 'Untitled').replace(/"/g, '\\"')}"`,
        `description: "${(page.metaDescription || '').replace(/"/g, '\\"')}"`,
        `type: "${page.pageType}"`,
        `source: "${page.url}"`,
        `lastSynced: "${new Date().toISOString()}"`,
        '---',
        '',
      ].join('\n');

      const fullMdx = frontmatter + mdx;

      // Write MDX file
      const mdxSlug = slug.replace(/__/g, '/');
      const mdxPath = path.join(MDX_DIR, `${slug}.mdx`);
      await fs.writeFile(mdxPath, fullMdx, 'utf-8');

      // Add to search index
      searchDocs.push({
        id: slug,
        title: page.title || page.h1 || 'Untitled',
        path: newPath,
        excerpt: (raw.text || '').substring(0, 200),
        type: page.pageType,
        content: (raw.text || '').substring(0, 5000),
      });

      // Generate redirect
      if (page.path !== newPath) {
        redirects.push({
          source: page.path,
          destination: newPath,
          permanent: true,
        });
      }

      stats.success++;
    } catch (e) {
      stats.errors++;
      if (stats.errors <= 10) {
        console.log(`   ⚠️  ${slug}: ${e.message}`);
      }
    }
  }

  // Write search index
  await fs.writeFile(
    path.join(SEARCH_DIR, 'documents.json'),
    JSON.stringify(searchDocs, null, 2),
    'utf-8'
  );

  // Build MiniSearch index
  // We'll save the documents and let the app build the index at startup
  console.log(`   📝 Search index: ${searchDocs.length} documents`);

  // Write redirects
  await fs.writeFile(REDIRECTS_PATH, JSON.stringify(redirects, null, 2), 'utf-8');

  // Print stats
  console.log('\n' + '='.repeat(60));
  console.log('📊 TRANSFORMATION REPORT');
  console.log('='.repeat(60));
  console.log(`Successfully transformed: ${stats.success}`);
  console.log(`Skipped (too little content): ${stats.skipped}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`Search documents: ${searchDocs.length}`);
  console.log(`Redirects generated: ${redirects.length}`);

  // Redirect coverage
  const totalSourcePages = report.pages.length;
  const mappedPages = redirects.length;
  const coverage = ((mappedPages / totalSourcePages) * 100).toFixed(1);
  console.log(`\nRedirect coverage: ${coverage}% (${mappedPages}/${totalSourcePages} pages)`);

  console.log(`\nOutput:`);
  console.log(`  MDX files: ${MDX_DIR}`);
  console.log(`  Search index: ${SEARCH_DIR}`);
  console.log(`  Redirects: ${REDIRECTS_PATH}`);
}

transform().catch(e => {
  console.error('Fatal transform error:', e);
  process.exit(1);
});
