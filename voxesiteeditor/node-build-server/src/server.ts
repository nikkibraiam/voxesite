import express from 'express'
import cors from 'cors'
import { saveSite } from './saveSite'
import { buildSite } from './buildSite'
import { readSite } from './readSite'

const app = express()

app.use(cors())
app.use(express.json())

// 🔹 READ
app.get('/api/:siteId/page/:slug', async (req, res) => {
  const { siteId, slug } = req.params

  try {
    const result = await readSite(siteId, slug)
    res.json(result)
  } catch (error) {
    res.status(500).json({ ok: false, error })
  }
})

// 🔹 SAVE
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

// 🔹 BUILD
app.post('/api/:siteId/build', async (req, res) => {
  const { siteId } = req.params

  try {
    await buildSite(siteId)
    res.json({ ok: true, message: `Build completado para ${siteId}` })
  } catch (error) {
    res.status(500).json({ ok: false, error })
  }
})

// 🔹 STATIC SERVE
app.use('/assets', express.static('./public_builds'))

const PORT = process.env.PORT || 2999
app.listen(PORT, () =>
  console.log(`Server corriendo en http://localhost:${PORT}`)
)
