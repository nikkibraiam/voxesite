import type { BaseBlock } from '../page'

export interface TableProps {
  headers?: string[] | string
  rows?: string[][] | string
  striped?: boolean
  bordered?: boolean
  caption?: string
  nonce?: string
}

export type TableBlock = BaseBlock<'Table', TableProps>
