/**
 * Migration script: MDX files → Payload CMS
 *
 * Usage: npx tsx scripts/migrate-to-payload.ts
 *
 * Requires DATABASE_URI and PAYLOAD_SECRET environment variables.
 */

import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import { getPayload } from 'payload'
import config from '../src/payload.config'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface FrontMatter {
  title: string
  description: string
  type: string
  source: string
  lastSynced: string
}

function parseFrontmatter(raw: string): { meta: Partial<FrontMatter>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { meta: {}, content: raw }

  const meta: Record<string, string> = {}
  for (const line of match[1].split('\n')) {
    const [key, ...rest] = line.split(': ')
    if (key && rest.length > 0) {
      meta[key.trim()] = rest.join(': ').replace(/^"(.*)"$/, '$1')
    }
  }
  return { meta: meta as Partial<FrontMatter>, content: match[2] }
}

function filenameToSlug(filename: string): string {
  return filename.replace('.mdx', '').replace(/__/g, '/')
}

function determinePageType(slug: string, type?: string): string {
  if (type) return type
  if (slug.startsWith('doc/apis') || slug.startsWith('doc/rest')) return 'api-reference'
  if (slug.startsWith('doc/sdk')) return 'sdk'
  if (slug.startsWith('doc/guides')) return 'guide'
  if (slug.startsWith('doc/faq')) return 'faq'
  if (slug.startsWith('doc/hub')) return 'docs'
  return 'docs'
}

// ---------------------------------------------------------------------------
// Main migration
// ---------------------------------------------------------------------------

async function main() {
  console.log('Starting migration...')

  const payload = await getPayload({ config })

  // -----------------------------------------------------------------------
  // 1. Migrate MDX files → Pages collection
  // -----------------------------------------------------------------------
  const contentDir = path.resolve(__dirname, '../../content/mdx')
  if (!fs.existsSync(contentDir)) {
    console.error(`Content directory not found: ${contentDir}`)
    process.exit(1)
  }

  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith('.mdx'))
  console.log(`Found ${files.length} MDX files to migrate`)

  let migrated = 0
  let skipped = 0
  let errors = 0

  for (const file of files) {
    const raw = fs.readFileSync(path.join(contentDir, file), 'utf-8')
    const { meta, content } = parseFrontmatter(raw)
    const slug = filenameToSlug(file)
    const pageType = determinePageType(slug, meta.type)

    try {
      // Check if page already exists
      const existing = await payload.find({
        collection: 'pages',
        where: { slug: { equals: slug } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        skipped++
        continue
      }

      await payload.create({
        collection: 'pages',
        data: {
          title: meta.title || slug.split('/').pop() || slug,
          slug,
          description: meta.description || '',
          type: pageType,
          markdownContent: content,
          source: meta.source || '',
          lastSynced: meta.lastSynced || new Date().toISOString(),
          _status: 'published',
        },
      })

      migrated++
      if (migrated % 50 === 0) {
        console.log(`  Migrated ${migrated} pages...`)
      }
    } catch (err) {
      errors++
      console.error(`  Error migrating ${file}:`, err instanceof Error ? err.message : err)
    }
  }

  console.log(`\nPages migration complete:`)
  console.log(`  Migrated: ${migrated}`)
  console.log(`  Skipped (already exists): ${skipped}`)
  console.log(`  Errors: ${errors}`)

  // -----------------------------------------------------------------------
  // 2. Seed SDKs collection from constants
  // -----------------------------------------------------------------------
  console.log('\nSeeding SDKs...')

  const SDK_LIST = [
    { name: 'Node.js SDK', slug: 'node', language: 'JavaScript/TypeScript' },
    { name: 'Web SDK', slug: 'web', language: 'JavaScript' },
    { name: 'Web SDK v2', slug: 'webv2', language: 'JavaScript/TypeScript' },
    { name: 'Android SDK', slug: 'android', language: 'Java/Kotlin' },
    { name: 'iOS SDK', slug: 'ios', language: 'Swift/Objective-C' },
    { name: 'C# SDK', slug: 'csharp', language: 'C#/.NET' },
    { name: 'React Native SDK', slug: 'reactnative', language: 'JavaScript/TypeScript' },
    { name: 'CLI SDK', slug: 'cli', language: 'Command Line' },
    { name: 'S2S Starter Kit', slug: 's2s-starterkit-nodejs', language: 'Node.js' },
  ]

  for (const sdk of SDK_LIST) {
    try {
      const existing = await payload.find({
        collection: 'sdks',
        where: { slug: { equals: sdk.slug } },
        limit: 1,
      })

      if (existing.docs.length === 0) {
        await payload.create({
          collection: 'sdks',
          data: sdk,
        })
        console.log(`  Created SDK: ${sdk.name}`)
      }
    } catch (err) {
      console.error(`  Error seeding SDK ${sdk.name}:`, err instanceof Error ? err.message : err)
    }
  }

  // -----------------------------------------------------------------------
  // 3. Seed Navigation global
  // -----------------------------------------------------------------------
  console.log('\nSeeding Navigation...')

  try {
    await payload.updateGlobal({
      slug: 'navigation',
      data: {
        items: [
          { label: 'Docs', url: '/docs' },
          { label: 'API Reference', url: '/api-reference' },
          { label: 'SDKs', url: '/docs/sdk' },
          { label: 'Support', url: '/support' },
        ],
      },
    })
    console.log('  Navigation seeded')
  } catch (err) {
    console.error('  Error seeding navigation:', err instanceof Error ? err.message : err)
  }

  // -----------------------------------------------------------------------
  // 4. Seed Footer global
  // -----------------------------------------------------------------------
  console.log('\nSeeding Footer...')

  try {
    await payload.updateGlobal({
      slug: 'footer',
      data: {
        sections: [
          {
            title: 'Product',
            links: [
              { label: 'Overview', url: '/' },
              { label: 'Documentation', url: '/docs' },
              { label: 'API Reference', url: '/api-reference' },
              { label: 'SDKs', url: '/docs/sdk' },
              { label: 'Changelog', url: '/changelog' },
            ],
          },
          {
            title: 'Developers',
            links: [
              { label: 'Getting Started', url: '/get-started' },
              { label: 'Guides', url: '/docs/guides' },
              { label: 'API Keys', url: '/portal/applications' },
              { label: 'Sandbox', url: '/portal/sandbox' },
            ],
          },
          {
            title: 'Company',
            links: [
              { label: 'About Rainbow', url: 'https://www.al-enterprise.com/rainbow', external: true },
              { label: 'Support', url: '/support' },
              { label: 'Legal', url: '/legal' },
              { label: 'Privacy', url: '/legal/privacy' },
            ],
          },
        ],
      },
    })
    console.log('  Footer seeded')
  } catch (err) {
    console.error('  Error seeding footer:', err instanceof Error ? err.message : err)
  }

  // -----------------------------------------------------------------------
  // 5. Seed Homepage global
  // -----------------------------------------------------------------------
  console.log('\nSeeding Homepage...')

  try {
    await payload.updateGlobal({
      slug: 'homepage',
      data: {
        blocks: [
          {
            blockType: 'hero',
            badge: 'Enterprise-grade CPaaS platform',
            headline: 'Add communications',
            headlineHighlight: 'to your apps',
            tagline: 'Rainbow CPaaS gives you messaging, voice, video conferencing, and automation through simple APIs and SDKs. Build connected experiences in minutes, not months.',
            ctas: [
              { label: 'Get started', url: '/get-started', variant: 'primary' },
              { label: 'Quickstart guide', url: '/docs/getting-started', variant: 'secondary' },
              { label: 'API reference', url: '/api-reference', variant: 'secondary' },
            ],
            codeSnippet: `import RainbowSDK from "rainbow-node-sdk"\n\n// Initialize the SDK\nconst rainbow = new RainbowSDK({\n  appID: process.env.RAINBOW_APP_ID,\n  appSecret: process.env.RAINBOW_APP_SECRET,\n});\n\n// Send a message\nawait rainbow.im.sendMessage("Hello from Rainbow!", contact);`,
            codeFilename: 'quickstart.js',
          },
          {
            blockType: 'featureGrid',
            heading: 'Everything you need to build connected experiences',
            subheading: 'Rainbow CPaaS provides a comprehensive set of communication APIs and SDKs for enterprise applications.',
            features: [
              { title: 'Messaging & Chat', description: 'Integrate instant messaging, group chats, and rich media sharing into your applications with simple API calls.', icon: 'message' },
              { title: 'Voice & Telephony', description: 'Add voice calling, PBX integration, and telephony features including call management and routing.', icon: 'phone' },
              { title: 'Video Conferencing', description: 'Embed video conferencing with screen sharing, recording, and multi-party calls directly in your apps.', icon: 'video' },
              { title: 'Bots & Automation', description: 'Build intelligent chatbots and automate workflows with Rainbow\'s bot framework and webhook system.', icon: 'bot' },
              { title: 'Admin & Provisioning', description: 'Manage users, companies, and resources programmatically through comprehensive administration APIs.', icon: 'admin' },
              { title: 'Presence & Contacts', description: 'Access real-time presence information, manage contacts, and build directory services.', icon: 'users' },
            ],
          },
          {
            blockType: 'howItWorks',
            heading: 'Get started in minutes',
            subheading: 'Three simple steps to add communications to your application.',
            steps: [
              { title: 'Create your application', description: 'Register on the Rainbow developer hub to create your application and get your credentials.' },
              { title: 'Get your API keys', description: 'Obtain your App ID and App Secret to authenticate API requests and SDK connections.' },
              { title: 'Start building', description: 'Use the REST APIs or pick an SDK (Node.js, Web, Android, iOS, C#) to integrate Rainbow into your app.' },
            ],
            ctaLabel: 'Start the setup wizard',
            ctaUrl: '/get-started',
          },
          {
            blockType: 'trustSection',
            heading: 'Enterprise security built in',
            subheading: 'Rainbow is designed for enterprise deployments with security at every layer.',
            items: [
              { title: 'TLS Encryption', description: 'All API communications are encrypted with TLS 1.2+ to protect data in transit.' },
              { title: 'OAuth 2.0 & JWT', description: 'Industry-standard authentication with OAuth 2.0 flows and JWT token-based access control.' },
              { title: 'API Key Management', description: 'Dedicated application credentials with granular permission scopes for secure integration.' },
              { title: 'Enterprise Ready', description: 'Built by Alcatel-Lucent Enterprise with data residency options and compliance certifications.' },
            ],
          },
          {
            blockType: 'cta',
            heading: 'Ready to start building?',
            description: 'Explore the documentation, try the sandbox, or jump straight into the API reference.',
            buttons: [
              { label: 'View documentation', url: '/docs', variant: 'primary' },
              { label: 'API reference', url: '/api-reference', variant: 'secondary' },
              { label: 'Try sandbox', url: '/portal/sandbox', variant: 'secondary' },
            ],
          },
        ],
      },
    })
    console.log('  Homepage seeded')
  } catch (err) {
    console.error('  Error seeding homepage:', err instanceof Error ? err.message : err)
  }

  // -----------------------------------------------------------------------
  // 6. Seed SiteConfig global
  // -----------------------------------------------------------------------
  console.log('\nSeeding SiteConfig...')

  try {
    await payload.updateGlobal({
      slug: 'site-config',
      data: {
        siteName: 'Rainbow',
        siteUrl: 'https://developers.rainbow.com',
        description: 'Add communications to your apps with Rainbow CPaaS. Messaging, voice, video conferencing, and more through simple APIs and SDKs.',
      },
    })
    console.log('  SiteConfig seeded')
  } catch (err) {
    console.error('  Error seeding site config:', err instanceof Error ? err.message : err)
  }

  // -----------------------------------------------------------------------
  // Done
  // -----------------------------------------------------------------------
  console.log('\nMigration complete!')
  process.exit(0)
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
