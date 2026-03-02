import type { BaseBlock } from '../page'

export interface ProgressBarProps {
  value?: number
  max?: number
  label?: string
  color?: string
  showPercentage?: boolean
  nonce?: string
}

export type ProgressBarBlock = BaseBlock<'ProgressBar', ProgressBarProps>
