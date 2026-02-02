import { defineAsyncComponent } from 'vue'
import type { Block } from '@cms/contracts'

const components = import.meta.glob('../components/*.vue')

export function renderBlock(block: Block) {
  const loader = components[`../components/${block.type}.vue`]

  if (!loader) {
    console.warn(`Block type "${block.type}" not registered`)
    return null
  }

  return defineAsyncComponent(loader as any)
}