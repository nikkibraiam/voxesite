import express from 'express'
import cors from 'cors'
import { saveSite } from './saveSite'
import { buildSite } from './buildSite'
import { readSite } from './readSite'
import { readSiteFull } from './readSiteFull'
import { saveSiteFull } from './saveSiteFull'
import { saveVersion, listVersions, rollbackVersion } from './versionManager'

const app = express()

app.use(cors())
app.use(express.json())

// ─── Site-level routes (new) ─────────────────────────────────────────────────

// GET full site — also handles auto-migration from legacy per-page files
app.get('/api/:siteId/site', async (req, res) => {
  const { siteId } = req.params
  try {
    const result = await readSiteFull(siteId)
    if (!result.data) {
      return res.status(404).json({ ok: false, message: 'Sitio no encontrado' })
    }
    res.json({ ok: true, data: result.data, migrated: result.migrated })
  } catch (error: any) {
    console.error(error)
    res.status(500).json({ ok: false, message: 'Error interno del servidor' })
  }
})

// POST full site (save + explode per-page files + CSS)
app.post('/api/:siteId/site', async (req, res) => {
  const { siteId } = req.params
  const { site, perPageCss } = req.body
  try {
    const result = await saveSiteFull(siteId, site, perPageCss)
    res.json(result)
  } catch (error) {
    res.status(500).json({ ok: false, error })
  }
})

// GET list of published version snapshots (newest-first)
app.get('/api/:siteId/versions', async (req, res) => {
  const { siteId } = req.params
  try {
    const versions = await listVersions(siteId)
    res.json({ ok: true, versions })
  } catch (error) {
    res.status(500).json({ ok: false, error })
  }
})

// POST rollback to a specific version snapshot
app.post('/api/:siteId/rollback/:version', async (req, res) => {
  const { siteId, version } = req.params
  try {
    const site = await rollbackVersion(siteId, version)
    res.json({ ok: true, data: site })
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      return res.status(404).json({ ok: false, message: error.message })
    }
    res.status(500).json({ ok: false, error })
  }
})

// ─── Page-level routes (kept for backward compat) ────────────────────────────

// GET a single page — reads from site.json first, falls back to per-page file.
// Used by apps/runtime/pages/[slug].vue and the runtime style API.
app.get('/api/:siteId/page/:slug', async (req, res) => {
  const { siteId, slug } = req.params

  try {
    // Prefer site.json (also triggers migration on first access)
    const siteResult = await readSiteFull(siteId)
    if (siteResult.data) {
      const page = siteResult.data.pages.find((p: any) => p.slug === slug)
      if (page) return res.json({ ok: true, data: page })
    }
    // Fall back to legacy per-page file (handles auto-create for new slugs)
    const result = await readSite(siteId, slug)
    res.json(result)
  } catch (error: any) {
    if (error.message === 'Página no encontrada') {
      return res.status(404).json({ ok: false, message: 'Página no encontrada' })
    }
    console.error(error)
    res.status(500).json({ ok: false, message: 'Error interno del servidor' })
  }
})

// POST save a single page + CSS (kept for backward compat, no longer called by editor)
app.post('/api/:siteId/save', async (req, res) => {
  const { siteId } = req.params
  const { slug, json, css, cssFileName } = req.body

  try {
    const result = await saveSite(siteId, slug, json, css, cssFileName)
    res.json(result)
  } catch (error) {
    res.status(500).json({ ok: false, error })
  }
})

// ─── Build route ─────────────────────────────────────────────────────────────

// POST trigger Nuxt static build.
// Snapshots the current site version before building (only if publishedAt is set).
app.post('/api/:siteId/build', async (req, res) => {
  const { siteId } = req.params

  try {
    // Snapshot the current version for rollback support
    const siteResult = await readSiteFull(siteId)
    if (siteResult.data?.publishedAt) {
      await saveVersion(siteId, siteResult.data)
    }

    await buildSite(siteId)
    res.json({ ok: true, message: `Build completado para ${siteId}` })
  } catch (error) {
    res.status(500).json({ ok: false, error })
  }
})

// ─── Static serve ─────────────────────────────────────────────────────────────

app.use('/assets', express.static('./public_builds'))

const PORT = process.env.PORT || 2999
app.listen(PORT, () =>
  console.log(`Server corriendo en http://localhost:${PORT}`)
)
