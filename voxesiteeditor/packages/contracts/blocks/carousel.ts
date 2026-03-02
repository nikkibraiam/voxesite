import type { BaseBlock } from '../page'

export interface CarouselItem {
  imageUrl: string
  alt?: string
  caption?: string
}

export interface CarouselProps {
  items?: CarouselItem[] | string
  autoplay?: boolean
  interval?: number
  showArrows?: boolean
  showDots?: boolean
  nonce?: string
}

export type CarouselBlock = BaseBlock<'Carousel', CarouselProps>
