import express from 'express'
import cors from 'cors'
import { buildSite } from './buildSite.js'

const app = express()
app.use(cors())
app.use(express.json())

// Endpoint para disparar build
app.post('/api/build', async (req, res) => {
  const { siteId } = req.body
  if (!siteId) return res.status(400).json({ error: 'siteId requerido' })

  try {
    await buildSite(siteId)
    res.json({ ok: true, message: `Build completado para ${siteId}` })
  } catch (error) {
    res.status(500).json({ ok: false, error })
  }
})

// Servir assets dinámicamente
app.use('/assets/:siteId', express.static('./public_builds'))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server corriendo en http://localhost:${PORT}`))
