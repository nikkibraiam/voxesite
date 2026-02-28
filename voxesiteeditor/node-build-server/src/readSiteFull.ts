import { readFile, writeFile, readdir, mkdir } from 'fs/promises'
import { resolve, join } from 'path'

// Local type definitions — the build server is CommonJS and does not depend on
// the @cms/contracts workspace package. Shapes must match contracts/page.ts.
interface Page {
  id: string
  slug: string
  title?: string
  blocks: any[]
  cssFile?: string
  [key: string]: any
}

interface Site {
  id: string
  version: string
  pages: Page[]
  layout: Record<string, any>
  publishedAt?: string
}

interface ReadSiteResult {
  ok: boolean
  data: Site | null
  migrated: boolean
}

/**
 * Read the full site.json for a given siteId.
 * If site.json does not yet exist, auto-migrates from legacy per-page JSON
 * files found in data/pages/, wraps them in a Site, writes site.json,
 * and returns the migrated result.
 */
export async function readSiteFull(siteId: string): Promise<ReadSiteResult> {
  if (!siteId) throw new Error('siteId requerido')

  const baseDir = resolve(`./runtime_storage/${siteId}`)
  const sitePath = join(baseDir, 'site.json')

  try {
    const raw = await readFile(sitePath, 'utf-8')
    return { ok: true, data: JSON.parse(raw) as Site, migrated: false }
  } catch (err: any) {
    if (err.code !== 'ENOENT') throw err
    // site.json missing — try to migrate from legacy per-page files
    return migrateLegacyToSite(siteId, baseDir)
  }
}

/**
 * Build a Site from legacy per-page JSON files and persist it as site.json.
 * Idempotent: if called again, readSiteFull will find site.json next time.
 */
async function migrateLegacyToSite(
  siteId: string,
  baseDir: string
): Promise<ReadSiteResult> {
  const pagesDir = join(baseDir, 'data/pages')
  let pageFiles: string[] = []

  try {
    pageFiles = (await readdir(pagesDir)).filter(f => f.endsWith('.json'))
  } catch {
    // No data/pages/ directory — brand new installation, return empty
    return { ok: true, data: null, migrated: false }
  }

  const pages: Page[] = await Promise.all(
    pageFiles.map(async (file) => {
      const raw = await readFile(join(pagesDir, file), 'utf-8')
      return JSON.parse(raw) as Page
    })
  )

  const site: Site = {
    id: siteId,
    version: '1.0.0',
    pages,
    layout: {}
  }

  // Persist so subsequent reads skip migration
  await mkdir(baseDir, { recursive: true })
  await writeFile(sitePath, JSON.stringify(site, null, 2), 'utf-8')

  console.log(`[migration] Created site.json for "${siteId}" from ${pages.length} page(s)`)
  return { ok: true, data: site, migrated: true }
}
