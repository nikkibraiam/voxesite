import type { BaseBlock } from '../page'

export interface SearchBarProps {
  placeholder?: string
  searchUrl?: string
  buttonLabel?: string
  nonce?: string
}

export type SearchBarBlock = BaseBlock<'SearchBar', SearchBarProps>
