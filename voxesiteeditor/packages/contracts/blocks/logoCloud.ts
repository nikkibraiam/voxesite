import type { BaseBlock } from '../page'

export interface LogoItem {
  imageUrl: string
  alt?: string
  url?: string
}

export interface LogoCloudProps {
  title?: string
  logos?: LogoItem[] | string
  grayscale?: boolean
  nonce?: string
}

export type LogoCloudBlock = BaseBlock<'LogoCloud', LogoCloudProps>
