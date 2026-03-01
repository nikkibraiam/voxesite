import type { BaseBlock } from '../page'

export interface CompositeBlockDefinition {
  id: string                                    // crypto.randomUUID()
  name: string                                  // user-visible label, e.g. "Product Card"
  description?: string
  children: BaseBlock<string, any>[]            // child blocks with their full state
  layout: 'stack' | 'grid' | 'flex'
  layoutOptions?: {
    columns?: number
    gap?: string
  }
}

export interface CompositeBlockProps {
  definitionId: string
  overrides?: Record<string, Partial<BaseBlock<string, any>>>  // keyed by child blockId
}
