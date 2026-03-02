import type { BaseBlock } from '../page'

export interface StatItem {
  value: string
  label: string
  icon?: string
}

export interface StatsBannerProps {
  stats?: StatItem[] | string
  bgColor?: string
  textColor?: string
  columns?: number
  nonce?: string
}

export type StatsBannerBlock = BaseBlock<'StatsBanner', StatsBannerProps>
