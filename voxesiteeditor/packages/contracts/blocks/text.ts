import { BaseBlock } from "../page"

export interface TextProps {
  text: string
  class?: string | string[]
}

export type TextBlock = BaseBlock<'TextBlock', TextProps>