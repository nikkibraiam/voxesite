import { h, defineAsyncComponent } from 'vue'
import type { BaseBlock, SiteLayout, LayoutBlock } from '@cms/contracts'

const registry: Record<string, ReturnType<typeof defineAsyncComponent>> = {
  TextBlock: defineAsyncComponent(() => import('../components/TextBlock.vue')),
  Hero: defineAsyncComponent(() => import('../components/Hero.vue')),
  LayoutHeader: defineAsyncComponent(() => import('../components/LayoutHeader.vue')),
  LayoutFooter: defineAsyncComponent(() => import('../components/LayoutFooter.vue'))
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

/**
 * Render a single layout block (header or footer) from a LayoutBlock descriptor.
 * Returns a VNode or null if the block type is not registered.
 */
export function renderLayoutBlock(block: LayoutBlock) {
  return renderBlock(block)
}

/**
 * Convenience: extract the header VNode from a SiteLayout.
 * Returns null when no header is defined.
 */
export function renderLayoutHeader(layout: SiteLayout) {
  if (!layout.header) return null
  return renderLayoutBlock(layout.header)
}

/**
 * Convenience: extract the footer VNode from a SiteLayout.
 * Returns null when no footer is defined.
 */
export function renderLayoutFooter(layout: SiteLayout) {
  if (!layout.footer) return null
  return renderLayoutBlock(layout.footer)
}
