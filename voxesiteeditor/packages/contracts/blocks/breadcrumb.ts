import type { BaseBlock } from '../page'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbProps {
  items?: BreadcrumbItem[] | string
  separator?: string
  nonce?: string
}

export type BreadcrumbBlock = BaseBlock<'Breadcrumb', BreadcrumbProps>
