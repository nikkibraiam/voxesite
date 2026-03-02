import type { BaseBlock } from '../page'

export interface DividerProps {
  style?: 'line' | 'dots' | 'wave' | 'fade'
  margin?: 'sm' | 'md' | 'lg'
  nonce?: string
}

export type DividerBlock = BaseBlock<'Divider', DividerProps>
