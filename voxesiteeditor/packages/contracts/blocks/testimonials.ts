import type { BaseBlock } from '../page'

export interface Testimonial {
  text: string
  author: string
  avatarUrl?: string
  rating?: number
}

export interface TestimonialsProps {
  heading?: string
  testimonials?: Testimonial[] | string
  layout?: 'grid' | 'carousel'
  nonce?: string
}

export type TestimonialsBlock = BaseBlock<'Testimonials', TestimonialsProps>
