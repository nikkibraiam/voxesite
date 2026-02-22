import { BaseBlock } from "../../contracts"


export function generateBlockCss(block: BaseBlock<string, any>) {
  if (!block.styles && !block.customCss) return ''

  let css = ''
  const scope = `.block-${block.id}`

  for (const selector in block.styles) {
    const scopedSelectors = selector
      .split(',')
      .map(s => {
        const trimmed = s.trim()
        // Repetir el scope sube la especificidad a (0,2,0) o (0,3,0)
        // para ganar contra el scoped CSS de los componentes (0,2,0)
        return trimmed ? `${scope}${scope} ${trimmed}` : `${scope}${scope}`
      })
      .join(', ')

    css += `
${scopedSelectors} {
${Object.entries(block.styles[selector])
  .map(([prop, value]) => `  ${prop}: ${value};`)
  .join('\n')}
}
`
  }

  if (block.customCss?.trim()) {
    css += `\n${block.customCss.trim()}\n`
  }

  return css
}


