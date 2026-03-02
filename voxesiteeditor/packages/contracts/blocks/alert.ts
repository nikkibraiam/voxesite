import type { BaseBlock } from '../page'

export interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  message?: string
  dismissible?: boolean
  nonce?: string
}

export type AlertBlock = BaseBlock<'Alert', AlertProps>
