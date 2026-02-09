import { BaseBlock } from "../../contracts"

const ALLOWED_PROPERTIES = [
  'padding',
  'margin',
  'font-size',
  'color',
  'background',
  'line-height',
  'text-align'
]

export function generateBlockCss(block: BaseBlock<string, any>) {
  if (!block.styles) return ''

  let css = ''
  const scope = `.block-${block.id}`

  for (const selector in block.styles) {
    const scopedSelectors = selector
      .split(',')
      .map(s => `${scope} ${s.trim()}`)
      .join(', ')

    css += `
${scopedSelectors} {
${Object.entries(block.styles[selector])
  .map(([prop, value]) => `  ${prop}: ${value};`)
  .join('\n')}
}
`
  }

  return css
}


