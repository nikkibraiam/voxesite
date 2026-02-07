import { BaseBlock } from "../page"

export type TextBlock = BaseBlock<
  'TextBlock',
  {
    text: string
    class?: string | string[]
  }
>
