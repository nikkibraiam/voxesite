import type { BaseBlock } from '../page'

export interface CTABannerProps {
  heading?: string
  subtext?: string
  buttonLabel?: string
  buttonUrl?: string
  bgColor?: string
  textColor?: string
  nonce?: string
}

export type CTABannerBlock = BaseBlock<'CTABanner', CTABannerProps>
