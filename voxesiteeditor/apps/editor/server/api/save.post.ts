import type { Site } from '@cms/contracts'
import { generateBlockCss } from '@cms/utils'

/**
 * POST /api/save
 * Accepts the full Site JSON, generates per-page CSS, and sends everything to
 * the build server which persists site.json and explodes per-page files.
 */
export default defineEventHandler(async (event) => {
  const site = await readBody<Site>(event)

  // Generate CSS for every page and update each page's cssFile pointer
  const perPageCss: Array<{ slug: string; css: string; cssFileName: string }> = []

  for (const page of site.pages) {
    let cssContent = ''
    for (const block of page.blocks) {
      cssContent += generateBlockCss(block)
    }
    const cssFileName = `${page.slug}.css`
    page.cssFile = `/generated-css/${cssFileName}`
    perPageCss.push({ slug: page.slug, css: cssContent, cssFileName })
  }

  // Send to build server: full site + per-page CSS
  await $fetch('http://localhost:2999/api/demosite/site', {
    method: 'POST',
    body: { site, perPageCss }
  })

  return { ok: true }
})
