import type { Block } from 'payload'

export const HowItWorksBlock: Block = {
  slug: 'howItWorks',
  labels: {
    singular: 'How It Works',
    plural: 'How It Works',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'Get started in minutes',
    },
    {
      name: 'subheading',
      type: 'text',
    },
    {
      name: 'steps',
      type: 'array',
      required: true,
      maxRows: 5,
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
        },
        {
          name: 'icon',
          type: 'text',
        },
      ],
    },
    {
      name: 'ctaLabel',
      type: 'text',
    },
    {
      name: 'ctaUrl',
      type: 'text',
    },
  ],
}
