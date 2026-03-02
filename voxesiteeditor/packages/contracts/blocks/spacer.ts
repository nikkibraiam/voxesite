import type { BaseBlock } from '../page'

export interface SpacerProps {
  height?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom'
  customHeight?: string
  nonce?: string
}

export type SpacerBlock = BaseBlock<'Spacer', SpacerProps>
