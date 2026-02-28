import { HeroSchema } from './blocks/hero.schema'
import { TextBlockSchema } from './blocks/text.schema'
import { HeaderSchema } from './layout/header.schema'
import { FooterSchema } from './layout/footer.schema'

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

/**
 * Schema registry for layout blocks (header, footer).
 * Same shape as BlockSchemas so BlockEditorModal can consume both interchangeably.
 */
export const LayoutSchemas: Record<string, any> = {
  LayoutHeader: {
    content: HeaderSchema,
    styles: [ColorStylesSchema]
  },

  LayoutFooter: {
    content: FooterSchema,
    styles: [ColorStylesSchema]
  }
}

export { HeaderSchema, FooterSchema }
