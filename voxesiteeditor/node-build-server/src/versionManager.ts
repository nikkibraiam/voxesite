import { writeFile, readFile, readdir, mkdir } from 'fs/promises'
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

interface SiteVersion {
  version: string
  publishedAt: string
}

/**
 * Save a versioned snapshot of the site to:
 *   runtime_storage/{siteId}/versions/{version}/site.json
 * Called just before each build to preserve a rollback point.
 */
export async function saveVersion(siteId: string, site: Site): Promise<void> {
  const versionDir = resolve(`./runtime_storage/${siteId}/versions/${site.version}`)
  await mkdir(versionDir, { recursive: true })
  await writeFile(
    join(versionDir, 'site.json'),
    JSON.stringify(site, null, 2),
    'utf-8'
  )
  console.log(`[versions] Snapshot saved: ${siteId} v${site.version}`)
}

/**
 * List all persisted version snapshots for a site, sorted newest-first.
 * Returns [] if no versions exist yet.
 */
export async function listVersions(siteId: string): Promise<SiteVersion[]> {
  const versionsBase = resolve(`./runtime_storage/${siteId}/versions`)

  try {
    const entries = await readdir(versionsBase)
    const results: SiteVersion[] = []

    for (const entry of entries) {
      const sitePath = join(versionsBase, entry, 'site.json')
      try {
        const raw = await readFile(sitePath, 'utf-8')
        const site: Site = JSON.parse(raw)
        results.push({
          version: site.version,
          publishedAt: site.publishedAt ?? ''
        })
      } catch {
        // Corrupt or incomplete snapshot directory — skip it
      }
    }

    // Sort newest-first by publishedAt; fall back to semver string comparison
    return results.sort((a, b) => {
      const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
      const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
      return tb - ta
    })
  } catch (err: any) {
    if (err.code === 'ENOENT') return []
    throw err
  }
}

/**
 * Restore a specific version by copying its site.json to:
 *   runtime_storage/{siteId}/site.json
 * and exploding per-page files for the runtime.
 *
 * Does NOT trigger a rebuild — the caller is responsible for that.
 */
export async function rollbackVersion(siteId: string, version: string): Promise<Site> {
  const versionPath = resolve(
    `./runtime_storage/${siteId}/versions/${version}/site.json`
  )

  let raw: string
  try {
    raw = await readFile(versionPath, 'utf-8')
  } catch {
    throw new Error(`Version ${version} not found for site ${siteId}`)
  }

  const site: Site = JSON.parse(raw)
  const baseDir = resolve(`./runtime_storage/${siteId}`)
  const jsonDir = join(baseDir, 'data/pages')

  // Restore site.json
  await writeFile(join(baseDir, 'site.json'), raw, 'utf-8')

  // Explode per-page files so the runtime can serve them without a rebuild
  await mkdir(jsonDir, { recursive: true })
  for (const page of site.pages) {
    await writeFile(
      join(jsonDir, `${page.slug}.json`),
      JSON.stringify(page, null, 2),
      'utf-8'
    )
  }

  console.log(`[versions] Rolled back ${siteId} to v${version}`)
  return site
}
