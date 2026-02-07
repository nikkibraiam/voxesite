import { BaseBlock } from "../page"

export type HeroBlock = BaseBlock<
  'Hero',
  {
    title: string
    subtitle?: string
    ctaText?: string
    ctaUrl?: string
    class?: string | string[]
  }
>