import { h, defineAsyncComponent } from 'vue'
import type { BaseBlock } from '@cms/contracts'


const registry: Record<string, ReturnType<typeof defineAsyncComponent>> = {
  TextBlock: defineAsyncComponent(() => import('../components/TextBlock.vue')),
  Hero: defineAsyncComponent(() => import('../components/Hero.vue'))
}

export function renderBlock(block: BaseBlock<string, any>) {
  const Component = registry[block.type]

  if (!Component) {
    console.warn(`Block type "${block.type}" not registered`)
    return null
  }

  return h(Component, {
    class: [`block-${block.id}`, block.props.class],
    ...block.props
  })
}