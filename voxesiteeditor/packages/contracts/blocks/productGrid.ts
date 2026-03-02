import type { BaseBlock } from '../page'
import type { ProductCardProps } from './productCard'

export interface ProductGridProps {
  heading?: string
  products?: ProductCardProps[] | string
  columns?: number
  showFilter?: boolean
  filterKey?: string
  nonce?: string
}

export type ProductGridBlock = BaseBlock<'ProductGrid', ProductGridProps>
