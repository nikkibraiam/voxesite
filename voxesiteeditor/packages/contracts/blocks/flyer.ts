import type { BaseBlock } from '../page'

export interface FlyerProps {
  bgImageUrl?: string
  title?: string
  subtitle?: string
  overlay?: boolean
  overlayOpacity?: number
  textColor?: string
  nonce?: string
}

export type FlyerBlock = BaseBlock<'Flyer', FlyerProps>
