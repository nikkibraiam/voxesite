import type { BaseBlock } from '../page'

export interface PricingPlan {
  name: string
  price: string
  period?: string
  features?: string[]
  highlighted?: boolean
  ctaLabel?: string
  ctaUrl?: string
}

export interface PricingTableProps {
  heading?: string
  subheading?: string
  plans?: PricingPlan[] | string
  nonce?: string
}

export type PricingTableBlock = BaseBlock<'PricingTable', PricingTableProps>
