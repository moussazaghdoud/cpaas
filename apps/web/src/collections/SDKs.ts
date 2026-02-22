import type { CollectionConfig } from 'payload'
import { isAdminOrEditor } from '../access/roles'

export const SDKs: CollectionConfig = {
  slug: 'sdks',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    create: isAdminOrEditor,
    read: () => true,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'language',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'repoUrl',
      type: 'text',
      admin: {
        description: 'GitHub or package repository URL',
      },
    },
    {
      name: 'version',
      type: 'text',
    },
  ],
}
