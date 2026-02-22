import type { Block } from 'payload'

export const TrustSectionBlock: Block = {
  slug: 'trustSection',
  labels: {
    singular: 'Trust Section',
    plural: 'Trust Sections',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'Enterprise security built in',
    },
    {
      name: 'subheading',
      type: 'text',
    },
    {
      name: 'items',
      type: 'array',
      required: true,
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
  ],
}
