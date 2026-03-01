import { readFile, writeFile, readdir, mkdir } from 'fs/promises'
import { resolve, join } from 'path'
import { pool } from './db/client'

// Local type definitions — the build server does not depend on @cms/contracts.
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
 * Read the full site for a given siteId.
 *
 * Primary:  SELECT from Postgres `sites` table (when DATABASE_URL is set).
 * Fallback: Read from `runtime_storage/{siteId}/site.json` (filesystem).
 *
 * On filesystem path, auto-migrates from legacy per-page JSON files
 * (data/pages/) if site.json does not yet exist.
 */
export async function readSiteFull(siteId: string): Promise<ReadSiteResult> {
  if (!siteId) throw new Error('siteId requerido')

  if (pool) {
    return readSiteFromPostgres(siteId)
  }
  return readSiteFromFilesystem(siteId)
}

// ─── Postgres ────────────────────────────────────────────────────────────────

async function readSiteFromPostgres(siteId: string): Promise<ReadSiteResult> {
  const result = await pool!.query<{ data: Site }>(
    'SELECT data FROM sites WHERE id = $1',
    [siteId]
  )

  if (result.rows.length > 0) {
    return { ok: true, data: result.rows[0].data, migrated: false }
  }

  // Site not in Postgres yet — try to seed from filesystem for first-time setup
  return seedPostgresFromFilesystem(siteId)
}

/**
 * On first access, check if there's existing data on the filesystem
 * (from a previous file-based installation) and import it into Postgres.
 */
async function seedPostgresFromFilesystem(siteId: string): Promise<ReadSiteResult> {
  const baseDir = resolve(`./runtime_storage/${siteId}`)
  const sitePath = join(baseDir, 'site.json')

  let site: Site | null = null

  try {
    const raw = await readFile(sitePath, 'utf-8')
    site = JSON.parse(raw) as Site
  } catch {
    // site.json doesn't exist — try legacy per-page files
    const legacyResult = await migrateLegacyToSite(siteId, baseDir)
    site = legacyResult.data
  }

  if (!site) {
    return { ok: true, data: null, migrated: false }
  }

  // Persist to Postgres
  await pool!.query(
    `INSERT INTO sites (id, data)
     VALUES ($1, $2)
     ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = NOW()`,
    [siteId, JSON.stringify(site)]
  )

  console.log(`[readSiteFull] Seeded Postgres from filesystem for "${siteId}"`)
  return { ok: true, data: site, migrated: true }
}

// ─── Filesystem (fallback when DATABASE_URL not set) ─────────────────────────

async function readSiteFromFilesystem(siteId: string): Promise<ReadSiteResult> {
  const baseDir = resolve(`./runtime_storage/${siteId}`)
  const sitePath = join(baseDir, 'site.json')

  try {
    const raw = await readFile(sitePath, 'utf-8')
    return { ok: true, data: JSON.parse(raw) as Site, migrated: false }
  } catch (err: any) {
    if (err.code !== 'ENOENT') throw err
    return migrateLegacyToSite(siteId, baseDir)
  }
}

/**
 * Build a Site from legacy per-page JSON files and persist as site.json.
 * Idempotent: if called again, readSiteFromFilesystem will find site.json.
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

  await mkdir(baseDir, { recursive: true })
  const sitePath = join(baseDir, 'site.json')
  await writeFile(sitePath, JSON.stringify(site, null, 2), 'utf-8')

  console.log(`[migration] Created site.json for "${siteId}" from ${pages.length} page(s)`)
  return { ok: true, data: site, migrated: true }
}
