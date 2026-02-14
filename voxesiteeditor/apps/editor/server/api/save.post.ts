import type { Page } from '@cms/contracts'
import { generateBlockCss } from '@cms/utils'

export default defineEventHandler(async (event) => {
  const page = await readBody<Page>(event)

  // 🔹 Generamos CSS aquí
  let cssContent = ''
  for (const block of page.blocks) {
    cssContent += generateBlockCss(block)
  }

  const cssFileName = `${page.slug}.css`
  page.cssFile = `/generated-css/${cssFileName}`

  // 🔹 Enviamos a Node para persistir
  await $fetch('http://localhost:2999/api/demosite/save', {
    method: 'POST',
    body: {
      slug: page.slug,
      json: page,
      css: cssContent,
      cssFileName
    }
  })

  return { ok: true, cssFile: page.cssFile }
})
