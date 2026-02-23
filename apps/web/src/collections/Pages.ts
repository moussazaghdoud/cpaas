import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, publishedOnly } from '../access/roles'
import { HeroBlock } from '../blocks/HeroBlock'
import { FeatureGridBlock } from '../blocks/FeatureGridBlock'
import { HowItWorksBlock } from '../blocks/HowItWorksBlock'
import { TrustSectionBlock } from '../blocks/TrustSectionBlock'
import { CTABlock } from '../blocks/CTABlock'
import { RichContentBlock } from '../blocks/RichContentBlock'
import { CodeBlock } from '../blocks/CodeBlock'
import { FAQBlock } from '../blocks/FAQBlock'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'type', '_status', 'updatedAt'],
  },
  access: {
    create: isAdminOrEditor,
    read: publishedOnly,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  hooks: {
    afterChange: [
      async () => {
        // Invalidate search cache when a page is created/updated
        try {
          const { invalidateSearchIndex } = await import('../lib/search-cache')
          invalidateSearchIndex()
        } catch {
          // search-cache module not available
        }
      },
    ],
    afterDelete: [
      async () => {
        try {
          const { invalidateSearchIndex } = await import('../lib/search-cache')
          invalidateSearchIndex()
        } catch {
          // search-cache module not available
        }
      },
    ],
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL slug (e.g. "doc/hub/getting-started")',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'docs',
      options: [
        { label: 'Documentation', value: 'docs' },
        { label: 'API Reference', value: 'api-reference' },
        { label: 'Guide', value: 'guide' },
        { label: 'SDK', value: 'sdk' },
        { label: 'FAQ', value: 'faq' },
        { label: 'Marketing', value: 'marketing' },
        { label: 'Legal', value: 'legal' },
        { label: 'Changelog', value: 'changelog' },
      ],
    },
    {
      name: 'content',
      type: 'richText',
      admin: {
        description: 'Main page content (Lexical rich text editor)',
      },
    },
    {
      name: 'markdownContent',
      type: 'textarea',
      admin: {
        description: 'Raw markdown content (migrated from MDX files)',
      },
    },
    {
      name: 'blocks',
      type: 'blocks',
      blocks: [
        HeroBlock,
        FeatureGridBlock,
        HowItWorksBlock,
        TrustSectionBlock,
        CTABlock,
        RichContentBlock,
        CodeBlock,
        FAQBlock,
      ],
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
          admin: { description: 'Override the page title for SEO' },
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          admin: { description: 'Override the description for SEO' },
        },
        {
          name: 'ogImage',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
    {
      name: 'source',
      type: 'text',
      admin: {
        description: 'Original source URL (from migration)',
        position: 'sidebar',
      },
    },
    {
      name: 'lastSynced',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'Last sync date from original source',
      },
    },
  ],
}
