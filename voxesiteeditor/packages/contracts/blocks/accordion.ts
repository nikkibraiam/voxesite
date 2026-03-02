import type { BaseBlock } from '../page'

export interface AccordionItem {
  title: string
  content: string
}

export interface AccordionProps {
  items?: AccordionItem[] | string
  openFirst?: boolean
  openMultiple?: boolean
  nonce?: string
}

export type AccordionBlock = BaseBlock<'Accordion', AccordionProps>
