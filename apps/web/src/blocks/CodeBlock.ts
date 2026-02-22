import type { Block } from 'payload'

export const CodeBlock: Block = {
  slug: 'code',
  labels: {
    singular: 'Code Block',
    plural: 'Code Blocks',
  },
  fields: [
    {
      name: 'language',
      type: 'select',
      required: true,
      defaultValue: 'javascript',
      options: [
        { label: 'JavaScript', value: 'javascript' },
        { label: 'TypeScript', value: 'typescript' },
        { label: 'Python', value: 'python' },
        { label: 'Java', value: 'java' },
        { label: 'Kotlin', value: 'kotlin' },
        { label: 'Swift', value: 'swift' },
        { label: 'C#', value: 'csharp' },
        { label: 'Shell', value: 'shell' },
        { label: 'JSON', value: 'json' },
        { label: 'XML', value: 'xml' },
        { label: 'HTML', value: 'html' },
        { label: 'CSS', value: 'css' },
      ],
    },
    {
      name: 'code',
      type: 'code',
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      admin: { description: 'Optional filename or title for the code block' },
    },
    {
      name: 'showLineNumbers',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
