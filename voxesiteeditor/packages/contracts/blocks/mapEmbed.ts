import type { BaseBlock } from '../page'

export interface MapEmbedProps {
  address?: string
  zoom?: number
  height?: string
  title?: string
  nonce?: string
}

export type MapEmbedBlock = BaseBlock<'MapEmbed', MapEmbedProps>
