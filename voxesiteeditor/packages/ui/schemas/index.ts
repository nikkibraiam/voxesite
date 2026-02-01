import { HeroSchema } from './hero.schema'
import { TextBlockSchema } from './text.schema'
import type { Block } from '@cms/contracts'

export const BlockSchemas: Record<Block['type'], any> = {
  Hero: HeroSchema,
  TextBlock: TextBlockSchema
}
