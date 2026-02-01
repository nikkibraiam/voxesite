import type { Block } from '@cms/contracts'
import Hero from '../components/Hero.vue'
import TextBlock from '../components/TextBlock.vue'

const registry: Record<Block['type'], any> = {
  Hero,
  TextBlock
}

export function renderBlock(block: any) {
  switch (block.type) {
    case 'Hero':
      return Hero
    case 'TextBlock':
      return TextBlock
  }
}
