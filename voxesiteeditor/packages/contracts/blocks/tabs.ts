import type { BaseBlock } from '../page'

export interface TabItem {
  label: string
  content: string
}

export interface TabsProps {
  tabs?: TabItem[] | string
  defaultTab?: number
  nonce?: string
}

export type TabsBlock = BaseBlock<'Tabs', TabsProps>
