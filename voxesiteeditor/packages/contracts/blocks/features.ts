import type { BaseBlock } from '../page'

export interface Feature {
  icon?: string
  title: string
  description?: string
}

export interface FeaturesProps {
  heading?: string
  subheading?: string
  features?: Feature[] | string
  columns?: number
  nonce?: string
}

export type FeaturesBlock = BaseBlock<'Features', FeaturesProps>
