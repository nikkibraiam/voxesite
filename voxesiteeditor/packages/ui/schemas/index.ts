import { HeroSchema } from './blocks/hero.schema'
import { TextBlockSchema } from './blocks/text.schema'

import { ColorStylesSchema } from './styles/colors.schema'
import { TypographyStylesSchema } from './styles/typography.schema'
import { SpacingStylesSchema } from './styles/spacing.schema'

export const BlockSchemas: Record<string, any> = {
  Hero: {
    content: HeroSchema,
    styles: [
      ColorStylesSchema,
      TypographyStylesSchema,
      SpacingStylesSchema
    ]
  },

  TextBlock: {
    content: TextBlockSchema,
    styles: [
      ColorStylesSchema,
      TypographyStylesSchema
    ]
  }
}
