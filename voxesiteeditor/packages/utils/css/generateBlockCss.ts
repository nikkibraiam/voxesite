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

export function generateBlockCss(
  block: BaseBlock
) {
  if (!block.styles) return ''

  let css = ''

  for (const selector in block.styles) {
    css += `
.block-${block.id} ${selector} {
${Object.entries(block.styles[selector])
  .map(([k, v]) => `  ${k}: ${v};`)
  .join('\n')}
}
`
  }

  return css
}
