import type { BaseBlock } from '../page'

export interface ProductCardProps {
  imageUrl?: string
  name?: string
  price?: number
  originalPrice?: number
  badge?: string
  ctaLabel?: string
  ctaUrl?: string
  currency?: string
  nonce?: string
}

export type ProductCardBlock = BaseBlock<'ProductCard', ProductCardProps>
