import { writeFile, mkdir } from 'fs/promises'
import { resolve, join } from 'path'
import { pool } from './db/client'

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
 * Persist the full Site and explode per-page files for the runtime.
 *
 * Site JSON:
 *   Primary:  Upserted into Postgres `sites` table (when DATABASE_URL is set).
 *   Fallback: Written to `runtime_storage/{siteId}/site.json`.
 *
 * Per-page JSON + CSS files are always written to disk so the Nuxt SSR runtime
 * can serve them statically without querying Postgres.
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

  // 1. Persist site JSON (Postgres primary, filesystem fallback)
  if (pool) {
    await pool.query(
      `INSERT INTO sites (id, data)
       VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = NOW()`,
      [siteId, JSON.stringify(site)]
    )
  } else {
    // Filesystem fallback
    await writeFile(
      join(baseDir, 'site.json'),
      JSON.stringify(site, null, 2),
      'utf-8'
    )
  }

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
