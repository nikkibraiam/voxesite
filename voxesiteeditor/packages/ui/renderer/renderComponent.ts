import { h, defineAsyncComponent } from 'vue'
import type { BaseBlock, SiteLayout, LayoutBlock } from '@cms/contracts'

const registry: Record<string, ReturnType<typeof defineAsyncComponent>> = {
  TextBlock: defineAsyncComponent(() => import('../components/TextBlock.vue')),
  Hero: defineAsyncComponent(() => import('../components/Hero.vue')),
  LayoutHeader: defineAsyncComponent(() => import('../components/LayoutHeader.vue')),
  LayoutFooter: defineAsyncComponent(() => import('../components/LayoutFooter.vue'))
}

export interface RenderOptions {
  /**
   * CSP nonce to forward to block components.
   *
   * Block components that inject a <style> tag dynamically (e.g. for scoped CSS)
   * must set this nonce on the element so the browser allows it under a strict
   * `style-src 'nonce-xxx'` Content-Security-Policy.
   *
   * In practice, block CSS is delivered via external <link> stylesheets generated
   * by generateBlockCss.ts, so nonce threading through renderBlock is a provision
   * for future block types that need dynamic inline styles.
   */
  nonce?: string
}

export function renderBlock(block: BaseBlock<string, any>, options: RenderOptions = {}) {
  const Component = registry[block.type]

  if (!Component) {
    console.warn(`Block type "${block.type}" not registered`)
    return null
  }

  return h(Component, {
    class: [`block-${block.id}`, block.props.class],
    ...(options.nonce ? { 'data-csp-nonce': options.nonce } : {}),
    ...block.props
  })
}

/**
 * Render a single layout block (header or footer) from a LayoutBlock descriptor.
 * Returns a VNode or null if the block type is not registered.
 */
export function renderLayoutBlock(block: LayoutBlock, options: RenderOptions = {}) {
  return renderBlock(block, options)
}

/**
 * Convenience: extract the header VNode from a SiteLayout.
 * Returns null when no header is defined.
 */
export function renderLayoutHeader(layout: SiteLayout, options: RenderOptions = {}) {
  if (!layout.header) return null
  return renderLayoutBlock(layout.header, options)
}

/**
 * Convenience: extract the footer VNode from a SiteLayout.
 * Returns null when no footer is defined.
 */
export function renderLayoutFooter(layout: SiteLayout, options: RenderOptions = {}) {
  if (!layout.footer) return null
  return renderLayoutBlock(layout.footer, options)
}
