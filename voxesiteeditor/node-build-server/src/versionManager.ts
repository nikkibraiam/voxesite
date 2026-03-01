import { writeFile, readFile, readdir, mkdir } from 'fs/promises'
import { resolve, join } from 'path'
import { pool } from './db/client'

/** Copy every file from srcDir to destDir. Skips silently if srcDir is absent. */
async function copyDirFiles(srcDir: string, destDir: string): Promise<void> {
  let files: string[]
  try {
    files = await readdir(srcDir)
  } catch (err: any) {
    if (err.code === 'ENOENT') return
    throw err
  }
  if (files.length === 0) return
  await mkdir(destDir, { recursive: true })
  for (const file of files) {
    const content = await readFile(join(srcDir, file))
    await writeFile(join(destDir, file), content)
  }
}

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
 * Save a versioned snapshot of the site.
 *
 * Primary:  Inserts into Postgres `site_versions` table.
 * Fallback: Writes to `runtime_storage/{siteId}/versions/{version}/site.json`.
 *
 * Called just before each build to preserve a rollback point.
 */
export async function saveVersion(siteId: string, site: Site): Promise<void> {
  if (pool) {
    await pool.query(
      `INSERT INTO site_versions (site_id, version, data, published_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (site_id, version) DO UPDATE
         SET data = $3, published_at = $4`,
      [siteId, site.version, JSON.stringify(site), site.publishedAt ?? null]
    )
  } else {
    const versionDir = resolve(`./runtime_storage/${siteId}/versions/${site.version}`)
    await mkdir(versionDir, { recursive: true })
    await writeFile(
      join(versionDir, 'site.json'),
      JSON.stringify(site, null, 2),
      'utf-8'
    )
    const cssSourceDir = resolve(`./runtime_storage/${siteId}/generated-css`)
    await copyDirFiles(cssSourceDir, join(versionDir, 'generated-css'))
  }

  console.log(`[versions] Snapshot saved: ${siteId} v${site.version}`)
}

/**
 * List all persisted version snapshots for a site, sorted newest-first.
 * Returns [] if no versions exist yet.
 */
export async function listVersions(siteId: string): Promise<SiteVersion[]> {
  if (pool) {
    const result = await pool.query<{ version: string; published_at: string }>(
      `SELECT version, published_at
       FROM site_versions
       WHERE site_id = $1
       ORDER BY published_at DESC NULLS LAST`,
      [siteId]
    )
    return result.rows.map((row: { version: string; published_at: string }) => ({
      version: row.version,
      publishedAt: row.published_at ?? ''
    }))
  }

  // Filesystem fallback
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
        // Corrupt or incomplete snapshot — skip
      }
    }

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
 * Restore a specific version.
 *
 * Primary:  Reads from Postgres `site_versions`, then upserts into `sites`.
 * Fallback: Copies snapshot site.json from filesystem.
 *
 * Does NOT trigger a rebuild — the caller is responsible for that.
 */
export async function rollbackVersion(siteId: string, version: string): Promise<Site> {
  let site: Site

  if (pool) {
    const result = await pool.query<{ data: Site }>(
      `SELECT data FROM site_versions WHERE site_id = $1 AND version = $2`,
      [siteId, version]
    )

    if (result.rows.length === 0) {
      throw new Error(`Version ${version} not found for site ${siteId}`)
    }

    site = result.rows[0].data

    // Restore in sites table
    await pool.query(
      `INSERT INTO sites (id, data)
       VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = NOW()`,
      [siteId, JSON.stringify(site)]
    )
  } else {
    // Filesystem fallback
    const versionPath = resolve(`./runtime_storage/${siteId}/versions/${version}/site.json`)

    let raw: string
    try {
      raw = await readFile(versionPath, 'utf-8')
    } catch {
      throw new Error(`Version ${version} not found for site ${siteId}`)
    }

    site = JSON.parse(raw)
    const baseDir = resolve(`./runtime_storage/${siteId}`)
    await writeFile(join(baseDir, 'site.json'), raw, 'utf-8')

    const cssVersionDir = join(resolve(`./runtime_storage/${siteId}/versions/${version}`), 'generated-css')
    const cssTargetDir  = join(baseDir, 'generated-css')
    await copyDirFiles(cssVersionDir, cssTargetDir)
  }

  // Always explode per-page JSON files for the runtime (regardless of storage)
  const baseDir = resolve(`./runtime_storage/${siteId}`)
  const jsonDir = join(baseDir, 'data/pages')
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
