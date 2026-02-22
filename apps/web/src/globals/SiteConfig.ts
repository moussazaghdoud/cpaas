import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/roles'

export const SiteConfig: GlobalConfig = {
  slug: 'site-config',
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
      defaultValue: 'Rainbow',
    },
    {
      name: 'siteUrl',
      type: 'text',
      required: true,
      defaultValue: 'https://developers.rainbow.com',
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      defaultValue: 'Add communications to your apps with Rainbow CPaaS. Messaging, voice, video conferencing, and more through simple APIs and SDKs.',
    },
    {
      name: 'ogImage',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
