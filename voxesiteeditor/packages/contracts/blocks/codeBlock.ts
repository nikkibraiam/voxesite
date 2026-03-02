import type { BaseBlock } from '../page'

export interface CodeBlockProps {
  code?: string
  language?: string
  showCopyButton?: boolean
  showLineNumbers?: boolean
  nonce?: string
}

export type CodeBlockBlock = BaseBlock<'CodeBlock', CodeBlockProps>
