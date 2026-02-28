import { writeFile, mkdir } from 'fs/promises'
import { resolve, join } from 'path'

interface Page {
  id: string
  slug: string
  blocks: any[]
  [key: string]: any
}

interface Site {
  id: string
  version: string
  pages: Page[]
  layout: Record<string, any>
  publishedAt?: string
}

interface PerPageCss {
  slug: string
  css: string
  cssFileName: string
}

/**
 * Persist the full Site JSON and explode per-page files for the runtime.
 *
 * Writes:
 *   runtime_storage/{siteId}/site.json          — authoritative document
 *   runtime_storage/{siteId}/data/pages/*.json  — one per page (for runtime SSR + Nuxt generate)
 *   runtime_storage/{siteId}/generated-css/*.css — per-page CSS files
 */
export async function saveSiteFull(
  siteId: string,
  site: Site,
  perPageCss: PerPageCss[]
): Promise<{ ok: boolean }> {
  if (!siteId) throw new Error('siteId requerido')

  const baseDir = resolve(`./runtime_storage/${siteId}`)
  const jsonDir = join(baseDir, 'data/pages')
  const cssDir  = join(baseDir, 'generated-css')

  await mkdir(jsonDir, { recursive: true })
  await mkdir(cssDir,  { recursive: true })

  // 1. Write authoritative site.json
  await writeFile(
    join(baseDir, 'site.json'),
    JSON.stringify(site, null, 2),
    'utf-8'
  )

  // 2. Explode per-page JSON files (used by runtime [slug].vue + Nuxt generate)
  for (const page of site.pages) {
    await writeFile(
      join(jsonDir, `${page.slug}.json`),
      JSON.stringify(page, null, 2),
      'utf-8'
    )
  }

  // 3. Write per-page CSS files
  for (const { cssFileName, css } of perPageCss) {
    await writeFile(join(cssDir, cssFileName), css, 'utf-8')
  }

  return { ok: true }
}
