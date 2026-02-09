import type { HeroBlock } from './blocks/hero'
import type { TextBlock } from './blocks/text'

export type BlockStyles = {
  [selector: string]: {
    [cssProperty: string]: string
  }
}

export type BaseBlock<TType extends string, TProps> = {
  id: string
  type: TType
  props: TProps
  styles?: BlockStyles
}

export type Page = {
  id: string
  slug: string
  seo?: {
    title: string
    description?: string
  }
  blocks: BaseBlock<string, any>[]
}
