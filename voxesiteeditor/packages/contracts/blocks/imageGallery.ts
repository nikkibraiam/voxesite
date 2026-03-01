import type { BaseBlock } from '../page'

export interface GalleryImage {
  url: string
  alt?: string
}

export interface ImageGalleryProps {
  heading?: string
  images?: GalleryImage[] | string
  layout?: 'grid' | 'masonry'
  columns?: number
  nonce?: string
}

export type ImageGalleryBlock = BaseBlock<'ImageGallery', ImageGalleryProps>
