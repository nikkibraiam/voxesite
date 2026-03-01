import type { BaseBlock } from '../page'

export interface CardItem {
  imageUrl?: string
  title: string
  text?: string
  ctaLabel?: string
  ctaUrl?: string
}

export interface CardGridProps {
  heading?: string
  columns?: number
  cards?: CardItem[] | string
  bgColor?: string
  cardBgColor?: string
  nonce?: string
}

export type CardGridBlock = BaseBlock<'CardGrid', CardGridProps>
