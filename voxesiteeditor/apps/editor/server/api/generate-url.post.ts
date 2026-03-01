import { BlockSchemas, LayoutSchemas } from '@cms/ui/schemas'

const BUILD_SERVER_URL = 'http://localhost:2999'

/**
 * POST /api/generate-url
 * Body: { url: string, siteId: string }
 *
 * Thin proxy to build server's URL generation route.
 * Enriches the request with serialised schema context.
 * Supports SSE streaming when Accept: text/event-stream is set.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ url: string; siteId: string }>(event)

  if (!body.url) {
    throw createError({ statusCode: 400, message: 'url is required' })
  }

  const schemaContext = JSON.stringify({ BlockSchemas, LayoutSchemas }, null, 2)
  const siteId = body.siteId ?? 'demosite'
  const acceptHeader = getHeader(event, 'accept') ?? ''
  const wantsStream = acceptHeader.includes('text/event-stream')

  const forwardBody = JSON.stringify({ url: body.url, schemaContext })

  if (wantsStream) {
    setHeader(event, 'Content-Type', 'text/event-stream')
    setHeader(event, 'Cache-Control', 'no-cache')
    setHeader(event, 'Connection', 'keep-alive')

    const upstream = await fetch(`${BUILD_SERVER_URL}/api/${siteId}/generate/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: forwardBody
    })

    if (!upstream.ok || !upstream.body) {
      throw createError({ statusCode: 502, message: 'Build server generation route unavailable' })
    }

    return sendStream(event, upstream.body)
  }

  const result = await $fetch<any>(`${BUILD_SERVER_URL}/api/${siteId}/generate/url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: forwardBody
  })

  return result
})
