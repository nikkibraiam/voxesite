import { BlockSchemas, LayoutSchemas } from '@cms/ui/schemas'

const BUILD_SERVER_URL = 'http://localhost:2999'

/**
 * POST /api/generate-screenshot
 * Body: { image: string (base64 or data URI), mimeType?: string, siteId: string }
 *
 * Thin proxy to build server's screenshot generation route.
 * Returns 400 immediately if the build server reports the model is text-only.
 * Supports SSE streaming when Accept: text/event-stream is set.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ image: string; mimeType?: string; siteId: string }>(event)

  if (!body.image) {
    throw createError({ statusCode: 400, message: 'image is required' })
  }

  const schemaContext = JSON.stringify({ BlockSchemas, LayoutSchemas }, null, 2)
  const siteId = body.siteId ?? 'demosite'
  const acceptHeader = getHeader(event, 'accept') ?? ''
  const wantsStream = acceptHeader.includes('text/event-stream')

  const forwardBody = JSON.stringify({
    image: body.image,
    mimeType: body.mimeType,
    schemaContext
  })

  if (wantsStream) {
    setHeader(event, 'Content-Type', 'text/event-stream')
    setHeader(event, 'Cache-Control', 'no-cache')
    setHeader(event, 'Connection', 'keep-alive')

    const upstream = await fetch(`${BUILD_SERVER_URL}/api/${siteId}/generate/screenshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: forwardBody
    })

    if (!upstream.ok || !upstream.body) {
      // Forward the error body from build server (may contain vision model error)
      const errText = await upstream.text().catch(() => 'Build server error')
      throw createError({ statusCode: upstream.status, message: errText })
    }

    return sendStream(event, upstream.body)
  }

  const result = await $fetch<any>(`${BUILD_SERVER_URL}/api/${siteId}/generate/screenshot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: forwardBody
  })

  return result
})
