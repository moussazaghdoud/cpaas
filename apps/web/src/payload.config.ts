import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import sharp from 'sharp'

// Collections
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { FAQs } from './collections/FAQs'
import { SDKs } from './collections/SDKs'

// Globals
import { Navigation } from './globals/Navigation'
import { Footer } from './globals/Footer'
import { Homepage } from './globals/Homepage'
import { SiteConfig } from './globals/SiteConfig'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' — Rainbow CMS',
      icons: [{ url: '/rainbow-logo.png' }],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },

  collections: [
    Users,
    Media,
    Pages,
    FAQs,
    SDKs,
  ],

  globals: [
    Navigation,
    Footer,
    Homepage,
    SiteConfig,
  ],

  editor: lexicalEditor(),

  db: process.env.DATABASE_URI?.startsWith('postgresql')
    ? postgresAdapter({
        pool: { connectionString: process.env.DATABASE_URI },
        push: true,
      })
    : sqliteAdapter({
        client: {
          url: process.env.DATABASE_URI || 'file:./data/payload.db',
        },
      }),

  sharp,

  secret: process.env.PAYLOAD_SECRET || 'CHANGE-ME-IN-PRODUCTION',

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
