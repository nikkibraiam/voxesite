import type { BaseBlock } from '../page'

export interface CountdownLabels {
  days?: string
  hours?: string
  minutes?: string
  seconds?: string
}

export interface CountdownProps {
  targetDate?: string
  labels?: CountdownLabels | string
  style?: 'boxes' | 'minimal'
  expiredMessage?: string
  nonce?: string
}

export type CountdownBlock = BaseBlock<'Countdown', CountdownProps>
