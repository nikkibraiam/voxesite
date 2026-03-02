import type { BaseBlock } from '../page'

export interface TimelineEvent {
  date?: string
  title: string
  description?: string
  icon?: string
}

export interface TimelineProps {
  heading?: string
  events?: TimelineEvent[] | string
  direction?: 'vertical' | 'horizontal'
  nonce?: string
}

export type TimelineBlock = BaseBlock<'Timeline', TimelineProps>
