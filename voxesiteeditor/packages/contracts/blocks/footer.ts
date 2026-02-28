import type { BaseBlock } from '../page'

export interface FooterLink {
  label: string
  href: string
}

export interface FooterColumn {
  title: string
  links: FooterLink[]
}

export interface FooterProps {
  /** Column groups — each with a title and array of links, serialized as JSON in the editor form */
  columns?: FooterColumn[]
  copyrightText?: string
  backgroundColor?: string
  class?: string | string[]
}

export type FooterBlock = BaseBlock<'LayoutFooter', FooterProps>
