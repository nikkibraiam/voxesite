import { h, defineAsyncComponent } from 'vue'
import type { VNode } from 'vue'
import type { BaseBlock, Site, SiteLayout, LayoutBlock } from '@cms/contracts'

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

  /**
   * Full site document — required to resolve Composite block definitions.
   * Pass this whenever rendering page blocks so composite blocks can look up
   * their `CompositeBlockDefinition` from `site.customComponents`.
   */
  site?: Site
}

export function renderBlock(block: BaseBlock<string, any>, options: RenderOptions = {}): VNode | null {
  // ── Composite block resolution ──────────────────────────────────────────────
  if (block.type === 'Composite') {
    const def = options.site?.customComponents?.find(c => c.id === block.props.definitionId)

    if (!def) {
      return h(
        'div',
        {
          class: 'composite-missing',
          style: 'border: 2px dashed red; padding: 16px; color: red; font-family: monospace;',
          'data-definition-id': block.props.definitionId
        },
        `⚠ Missing composite definition: ${block.props.definitionId}`
      )
    }

    const layoutStyle: Record<string, string> = { display: 'flex' }
    if (def.layout === 'stack') layoutStyle.flexDirection = 'column'
    if (def.layout === 'flex') layoutStyle.flexDirection = 'row'
    if (def.layout === 'grid') {
      layoutStyle.display = 'grid'
      if (def.layoutOptions?.columns) {
        layoutStyle.gridTemplateColumns = `repeat(${def.layoutOptions.columns}, 1fr)`
      }
    }
    if (def.layoutOptions?.gap) layoutStyle.gap = def.layoutOptions.gap

    return h(
      'div',
      { class: `composite composite-${def.id}`, 'data-layout': def.layout, style: layoutStyle },
      def.children.map(child => {
        const override = block.props.overrides?.[child.id]
        const merged: BaseBlock<string, any> = override
          ? { ...child, props: { ...child.props, ...override.props } }
          : child
        return renderBlock(merged, options)
      })
    )
  }

  // ── Standard registry lookup ─────────────────────────────────────────────────
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
