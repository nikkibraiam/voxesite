import { createServer } from 'http'
import express from 'express'
import cors from 'cors'
import { WebSocketServer } from 'ws'
import type { WebSocket as WsSocket } from 'ws'
import { saveSite } from './saveSite'
import { buildSite } from './buildSite'
import { readSite } from './readSite'
import { readSiteFull } from './readSiteFull'
import { saveSiteFull } from './saveSiteFull'
import { saveVersion, listVersions, rollbackVersion } from './versionManager'
import { createLLMAdapter, isVisionCapable } from './llm/factory'
import type { LLMMessage } from './llm/types'
import { createTranscriptionAdapter } from './transcription/whisperAdapter'
import { fetchUrlContent } from './pageGenerator/urlFetcher'
import { prepareScreenshot } from './pageGenerator/screenshotHandler'
import { sanitizeHtml } from './pageGenerator/htmlSanitizer'
import { generatePage } from './pageGenerator/pageGeneratorService'
import { setupCollaborationServer } from './collaboration/yjsServer'
import { pool } from './db/client'

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

// ─── AI prompt route ──────────────────────────────────────────────────────────

/**
 * POST /api/ai/prompt
 * Body: { prompt: string, pageJson: Page, siteId: string, schemaContext: string }
 *
 * schemaContext is the JSON-serialized BlockSchemas + LayoutSchemas sent by the
 * Nuxt proxy (which has access to @cms/ui and can serialize them at request time).
 *
 * Supports SSE streaming when Accept: text/event-stream is present.
 * Non-streaming returns { ok: true, page: Page } or { ok: false, error, raw }.
 */
app.post('/api/ai/prompt', async (req, res) => {
  const { prompt, pageJson, schemaContext } = req.body as {
    prompt: string
    pageJson: any
    siteId: string
    schemaContext: string
  }

  if (!prompt || !pageJson) {
    res.status(400).json({ ok: false, error: 'prompt and pageJson are required' })
    return
  }

  const wantsStream = (req.headers['accept'] ?? '').includes('text/event-stream')

  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: buildSystemPrompt(schemaContext, pageJson)
    },
    {
      role: 'user',
      content: prompt
    }
  ]

  const adapter = createLLMAdapter()

  if (wantsStream) {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    try {
      const fullText = await adapter.chatStream(messages, (token) => {
        res.write(`data: ${JSON.stringify({ token })}\n\n`)
      })

      // Signal completion with the full accumulated text
      res.write(`data: ${JSON.stringify({ done: true, text: fullText })}\n\n`)
      res.end()
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ error: err.message ?? 'LLM error' })}\n\n`)
      res.end()
    }
  } else {
    try {
      const text = await adapter.chat(messages)
      try {
        const page = JSON.parse(text)
        res.json({ ok: true, page })
      } catch {
        res.json({ ok: false, error: 'Invalid LLM response', raw: text })
      }
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message ?? 'LLM error' })
    }
  }
})

function buildSystemPrompt(schemaContext: string, pageJson: any): string {
  return `You are a CMS block editor assistant. The user will describe changes they want to make to a website page.
You must return ONLY a valid JSON object matching the Page schema. No explanation, no markdown fences, no code blocks.

Available block types and their schemas:
${schemaContext}

Current page JSON:
${JSON.stringify(pageJson, null, 2)}

Rules:
- Return the complete updated Page JSON, not a diff
- Preserve all block IDs unless explicitly asked to remove a block
- Only modify props and styles mentioned by the user
- Do not invent new block types not listed in the schemas above
- If unsure, return the page unchanged`
}

// ─── Page generation routes ───────────────────────────────────────────────────
//
// All three routes accept a `schemaContext` field in the request body (serialised
// BlockSchemas + LayoutSchemas, forwarded by the Nuxt proxy that has access to
// @cms/ui) and support SSE streaming when Accept: text/event-stream is set.

function sseHeaders(res: express.Response) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
}

async function handleGenerate(
  res: express.Response,
  schemaContext: string,
  textInput: string,
  image?: { data: string; mimeType: string }
) {
  const wantsStream = (res.req?.headers['accept'] ?? '').includes('text/event-stream')

  if (wantsStream) {
    sseHeaders(res)
    try {
      const page = await generatePage({
        schemaContext,
        textInput,
        image,
        onToken: (token) => res.write(`data: ${JSON.stringify({ token })}\n\n`)
      })
      res.write(`data: ${JSON.stringify({ done: true, page })}\n\n`)
      res.end()
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ error: err.message ?? 'Generation failed', raw: err.raw })}\n\n`)
      res.end()
    }
  } else {
    try {
      const page = await generatePage({ schemaContext, textInput, image })
      res.json({ ok: true, page })
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message ?? 'Generation failed', raw: err.raw })
    }
  }
}

/**
 * POST /api/:siteId/generate/url
 * Body: { url: string, schemaContext: string }
 *
 * Fetches the URL with Puppeteer, extracts screenshot + DOM text,
 * and generates a Page JSON via the configured LLM.
 */
app.post('/api/:siteId/generate/url', async (req, res) => {
  const { url, schemaContext } = req.body as { url: string; schemaContext: string }

  if (!url || !schemaContext) {
    return res.status(400).json({ ok: false, error: 'url and schemaContext are required' })
  }

  let fetchResult: Awaited<ReturnType<typeof fetchUrlContent>>
  try {
    fetchResult = await fetchUrlContent(url)
  } catch (err: any) {
    return res.status(422).json({ ok: false, error: err.message })
  }

  const textInput = `Generate a CMS page based on this website.\n\nURL: ${url}\n\nVisible DOM structure:\n${fetchResult.domText}`

  // Attach screenshot only when the model supports vision
  const image = isVisionCapable()
    ? { data: fetchResult.screenshotBase64, mimeType: 'image/jpeg' as const }
    : undefined

  await handleGenerate(res, schemaContext, textInput, image)
})

/**
 * POST /api/:siteId/generate/screenshot
 * Body: { image: string (base64 or data URI), mimeType?: string, schemaContext: string }
 *
 * Requires a vision-capable model. Returns 400 immediately if the configured
 * model is text-only.
 */
app.post('/api/:siteId/generate/screenshot', async (req, res) => {
  const { image: rawImage, mimeType, schemaContext } = req.body as {
    image: string
    mimeType?: string
    schemaContext: string
  }

  if (!rawImage || !schemaContext) {
    return res.status(400).json({ ok: false, error: 'image and schemaContext are required' })
  }

  if (!isVisionCapable()) {
    return res.status(400).json({
      ok: false,
      error: 'Vision model required for screenshot input. Set LLM_MODEL to a vision-capable model (e.g. gpt-4o, claude-opus-4-6, llava).'
    })
  }

  let imageInput: ReturnType<typeof prepareScreenshot>
  try {
    imageInput = prepareScreenshot(rawImage, mimeType)
  } catch (err: any) {
    return res.status(400).json({ ok: false, error: err.message })
  }

  const textInput = 'Generate a CMS page that faithfully reproduces the layout and content visible in this screenshot.'

  await handleGenerate(res, schemaContext, textInput, imageInput)
})

/**
 * POST /api/:siteId/generate/html
 * Body: { html: string, schemaContext: string }
 *
 * Sanitises the pasted HTML server-side, converts it to a text outline,
 * and generates a Page JSON via the configured LLM (no vision required).
 */
app.post('/api/:siteId/generate/html', async (req, res) => {
  const { html, schemaContext } = req.body as { html: string; schemaContext: string }

  if (!html || !schemaContext) {
    return res.status(400).json({ ok: false, error: 'html and schemaContext are required' })
  }

  const { domText } = sanitizeHtml(html)

  const textInput = `Generate a CMS page based on this HTML content.\n\nDOM structure:\n${domText}`

  await handleGenerate(res, schemaContext, textInput)
})

// ─── Static serve ─────────────────────────────────────────────────────────────

app.use('/assets', express.static('./public_builds'))

// ─── HTTP server + WebSocket server ──────────────────────────────────────────
//
// We create an explicit http.Server so the WebSocket server can share the same
// port as Express (ws upgrade requests are routed by path).

const httpServer = createServer(app)

// ─── WebSocket servers (noServer mode — upgrade routing done manually) ────────
//
// Using noServer:true for both WS servers lets us route upgrade requests by
// path prefix, which the built-in `path` option doesn't support (exact match).
//
//   /transcription        — voice transcription (JSON protocol)
//   /collaboration/{id}   — Yjs collaborative editing (binary y-websocket protocol)

const transcriptionWss = new WebSocketServer({ noServer: true })
const collabWss        = new WebSocketServer({ noServer: true })

httpServer.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname

  if (pathname === '/transcription') {
    transcriptionWss.handleUpgrade(request, socket, head, (ws) => {
      transcriptionWss.emit('connection', ws, request)
    })
  } else if (pathname.startsWith('/collaboration')) {
    collabWss.handleUpgrade(request, socket, head, (ws) => {
      collabWss.emit('connection', ws, request)
    })
  } else {
    socket.destroy()
  }
})

// ─── Yjs collaboration server ─────────────────────────────────────────────────

setupCollaborationServer(collabWss, pool)

// ─── WebSocket transcription server (/transcription) ─────────────────────────
//
// Protocol (JSON over WebSocket):
//
//   Client → Server:
//     { type: "VOICE_CHUNK", payload: { audio: "<base64>", mimeType: "audio/webm" } }
//     { type: "VOICE_END" }          ← signals end of audio; triggers transcription
//
//   Server → Client:
//     { type: "TRANSCRIPT_TOKEN",  payload: { token: "Hello" } }
//     { type: "TRANSCRIPT_DONE",   payload: { fullText: "Hello world" } }
//     { type: "TRANSCRIPT_ERROR",  payload: { message: "..." } }

transcriptionWss.on('connection', (socket: WsSocket) => {
  console.log('[WS /transcription] Client connected')

  // Buffer for accumulated audio chunks from this session
  const audioChunks: Buffer[] = []
  let sessionMimeType = 'audio/webm'

  socket.on('message', async (rawData) => {
    let msg: { type: string; payload?: any }
    try {
      msg = JSON.parse(rawData.toString())
    } catch {
      return // ignore malformed frames
    }

    if (msg.type === 'VOICE_CHUNK') {
      const { audio, mimeType } = msg.payload ?? {}
      if (typeof audio === 'string') {
        audioChunks.push(Buffer.from(audio, 'base64'))
      }
      if (mimeType) sessionMimeType = mimeType
    }

    if (msg.type === 'VOICE_END') {
      if (audioChunks.length === 0) {
        socket.send(
          JSON.stringify({
            type: 'TRANSCRIPT_ERROR',
            payload: { message: 'No audio chunks received before VOICE_END' }
          })
        )
        return
      }

      const fullBuffer = Buffer.concat(audioChunks)
      audioChunks.length = 0 // clear for potential next session on same socket

      const adapter = createTranscriptionAdapter()
      let fullText = ''

      try {
        for await (const token of adapter.transcribe(fullBuffer, sessionMimeType)) {
          fullText += token
          if (socket.readyState === socket.OPEN) {
            socket.send(
              JSON.stringify({ type: 'TRANSCRIPT_TOKEN', payload: { token } })
            )
          }
        }

        if (socket.readyState === socket.OPEN) {
          socket.send(
            JSON.stringify({
              type: 'TRANSCRIPT_DONE',
              payload: { fullText: fullText.trim() }
            })
          )
        }
      } catch (err: any) {
        if (socket.readyState === socket.OPEN) {
          socket.send(
            JSON.stringify({
              type: 'TRANSCRIPT_ERROR',
              payload: { message: err.message ?? 'Transcription failed' }
            })
          )
        }
      }
    }
  })

  socket.on('close', () => {
    console.log('[WS /transcription] Client disconnected')
  })

  socket.on('error', (err) => {
    console.error('[WS /transcription] Socket error:', err)
  })
}) // end transcriptionWss.on('connection')

const PORT = process.env.PORT || 2999
httpServer.listen(PORT, () =>
  console.log(`Server corriendo en http://localhost:${PORT}`)
)
