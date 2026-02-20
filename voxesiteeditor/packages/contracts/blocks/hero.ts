import { BaseBlock } from "../page"

export interface HeroProps {
  title: string
  subtitle?: string
  ctaText?: string
  ctaUrl?: string
  class?: string | string[]
}

export type HeroBlock = BaseBlock<'Hero', HeroProps>