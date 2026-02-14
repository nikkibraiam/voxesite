import type { Page } from '@cms/contracts'
import { generateBlockCss } from '@cms/utils'

function generatePageCss(page: Page) {
  let css = ''

  for (const block of page.blocks) {
    css += generateBlockCss(block)
  }

  return css
}

function generateCSS(page: Page): string {
  return generatePageCss(page)
}

export default defineEventHandler(async (event) => {
  const slug = event.context.params?.slug
  const siteId = 'demosite' // luego lo haces dinámico

  try {
    const response = await fetch(
      `http://localhost:2999/api/${siteId}/page/${slug}`
    )

    if (!response.ok) {
      // throw new Error('Página no encontrada')
      return ''
    }

    const result = await response.json()
    const page: Page = result.data

    setHeader(event, 'Content-Type', 'text/css')
    setHeader(event, 'Cache-Control', 'no-store')

    return generateCSS(page)

  } catch (error) {
    console.error(error)
    return ''
  }
})
