import type { HeroBlock } from './blocks/hero'
import type { TextBlock } from './blocks/text'

export type Block =
  | HeroBlock
  | TextBlock

export type Page = {
  id: string
  slug: string
  seo?: {
    title: string
    description?: string
  }
  blocks: Block[]
}
