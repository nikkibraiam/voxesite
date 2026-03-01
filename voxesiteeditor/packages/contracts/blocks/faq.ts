import type { BaseBlock } from '../page'

export interface FAQItem {
  question: string
  answer: string
}

export interface FAQProps {
  heading?: string
  items?: FAQItem[] | string
  openMultiple?: boolean
  nonce?: string
}

export type FAQBlock = BaseBlock<'FAQ', FAQProps>
