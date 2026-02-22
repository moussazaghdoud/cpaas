import type { Block } from 'payload'

export const HeroBlock: Block = {
  slug: 'hero',
  labels: {
    singular: 'Hero',
    plural: 'Heroes',
  },
  fields: [
    {
      name: 'badge',
      type: 'text',
      defaultValue: 'Enterprise-grade CPaaS platform',
    },
    {
      name: 'headline',
      type: 'text',
      required: true,
      defaultValue: 'Add communications to your apps',
    },
    {
      name: 'headlineHighlight',
      type: 'text',
      admin: { description: 'Gradient-highlighted portion of headline' },
    },
    {
      name: 'tagline',
      type: 'textarea',
      required: true,
    },
    {
      name: 'ctas',
      type: 'array',
      maxRows: 3,
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
        {
          name: 'variant',
          type: 'select',
          defaultValue: 'secondary',
          options: [
            { label: 'Primary', value: 'primary' },
            { label: 'Secondary', value: 'secondary' },
          ],
        },
      ],
    },
    {
      name: 'codeSnippet',
      type: 'code',
      admin: {
        language: 'javascript',
        description: 'Code sample displayed in the hero section',
      },
    },
    {
      name: 'codeFilename',
      type: 'text',
      defaultValue: 'quickstart.js',
    },
  ],
}
