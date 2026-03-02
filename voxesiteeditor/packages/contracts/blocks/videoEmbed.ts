import type { BaseBlock } from '../page'

export interface VideoEmbedProps {
  videoUrl?: string
  autoplay?: boolean
  muted?: boolean
  posterUrl?: string
  aspectRatio?: string
  nonce?: string
}

export type VideoEmbedBlock = BaseBlock<'VideoEmbed', VideoEmbedProps>
