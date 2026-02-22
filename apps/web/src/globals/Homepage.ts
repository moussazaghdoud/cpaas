import type { GlobalConfig } from 'payload'
import { isAdminOrEditor } from '../access/roles'
import { HeroBlock } from '../blocks/HeroBlock'
import { FeatureGridBlock } from '../blocks/FeatureGridBlock'
import { HowItWorksBlock } from '../blocks/HowItWorksBlock'
import { TrustSectionBlock } from '../blocks/TrustSectionBlock'
import { CTABlock } from '../blocks/CTABlock'
import { FAQBlock } from '../blocks/FAQBlock'
import { RichContentBlock } from '../blocks/RichContentBlock'
import { CodeBlock } from '../blocks/CodeBlock'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  access: {
    read: () => true,
    update: isAdminOrEditor,
  },
  fields: [
    {
      name: 'blocks',
      type: 'blocks',
      required: true,
      blocks: [
        HeroBlock,
        FeatureGridBlock,
        HowItWorksBlock,
        TrustSectionBlock,
        CTABlock,
        FAQBlock,
        RichContentBlock,
        CodeBlock,
      ],
    },
  ],
}
