import type { BaseBlock } from '../page'

export interface ProductSpec {
  label: string
  value: string
}

export interface ProductImage {
  url: string
  alt?: string
}

export interface ProductDetailProps {
  images?: ProductImage[] | string
  name?: string
  price?: number
  originalPrice?: number
  currency?: string
  description?: string
  specs?: ProductSpec[] | string
  ctaLabel?: string
  ctaUrl?: string
  nonce?: string
}

export type ProductDetailBlock = BaseBlock<'ProductDetail', ProductDetailProps>
