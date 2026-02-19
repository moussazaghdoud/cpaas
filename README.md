# Rainbow CPaaS Developer Portal

Modern developer portal for Rainbow CPaaS, migrated from [developers.openrainbow.com](https://developers.openrainbow.com/).

## Architecture

```
/apps/web          → Next.js 16 site (App Router, TypeScript, Tailwind)
/scripts/crawl     → Playwright crawler for source site
/scripts/transform → HTML → MDX converter + search index builder
/content/raw       → Crawled HTML snapshots + extracted JSON
/content/mdx       → Generated MDX docs files
/content/openapi   → Downloaded OpenAPI specifications
/content/search-index → MiniSearch index documents
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm

### Install dependencies

```bash
# Root (crawler + transformer)
npm install

# Web app
cd apps/web && npm install
```

### Run locally

```bash
cd apps/web
npx next dev
```

Open [http://localhost:3000](http://localhost:3000).

### Sync content from source site

```bash
# Full pipeline: crawl + transform
npm run content:sync

# Or individually:
npm run crawl      # Crawl developers.openrainbow.com
npm run transform  # Convert HTML → MDX + build search index
```

### Build for production

```bash
cd apps/web
npx next build
```

### Validate

```bash
npm run validate
```

## Content Refresh

Run the content sync pipeline to pull latest content:

```bash
npm run content:sync
```

This will:
1. Crawl all discoverable pages on developers.openrainbow.com
2. Extract content, detect page types, download OpenAPI specs
3. Convert HTML to MDX with proper heading hierarchy
4. Build the search index
5. Generate redirect mappings

## Key Routes

| Route | Description |
|-------|-------------|
| `/` | Marketing homepage |
| `/docs` | Documentation hub |
| `/docs/getting-started` | Quickstart guide |
| `/docs/sdk` | SDK index |
| `/docs/sdk/[slug]` | SDK-specific docs |
| `/docs/guides` | Developer guides |
| `/api-reference` | REST API index |
| `/api-reference/[slug]` | API-specific reference |
| `/support` | Support & help |
| `/legal` | Legal information |
| `/changelog` | Release notes |

## Editing Marketing Copy

Marketing content is in these files:
- Homepage: `apps/web/src/app/page.tsx`
- Hero section: `apps/web/src/components/marketing/Hero.tsx`
- Features: `apps/web/src/components/marketing/FeatureGrid.tsx` + `apps/web/src/lib/constants.ts`
- How it works: `apps/web/src/components/marketing/HowItWorks.tsx`
- Trust section: `apps/web/src/components/marketing/TrustSection.tsx`

## Deployment

### Vercel (recommended)

1. Push repo to GitHub
2. Import into Vercel
3. Set root directory to `apps/web`
4. Deploy

### Netlify

1. Push repo to GitHub
2. Import into Netlify
3. Build command: `cd apps/web && npx next build`
4. Publish directory: `apps/web/.next`

### Docker / Self-hosted

```bash
cd apps/web
npx next build
npx next start
```

## What Remains Manual

- **SDK detail pages**: Individual SDK API reference pages (classes/methods) are not
  auto-converted due to volume (1000+ per SDK). They link to the source portal.
- **OpenAPI integration**: Downloaded specs are in `/content/openapi/` but full
  endpoint-level rendering needs OpenAPI parser integration.
- **Images**: Any images referenced from the source site should be downloaded and
  hosted locally for production.
- **Authentication flows**: "Get API Keys" CTAs link to the original developer hub.

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS** v4 for styling
- **MiniSearch** for client-side search
- **Playwright** for JS-rendered page crawling
- **Cheerio + Turndown** for HTML → Markdown conversion
- **Shiki** (optional) for code syntax highlighting
