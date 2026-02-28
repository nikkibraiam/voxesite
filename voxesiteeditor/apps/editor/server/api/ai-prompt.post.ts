import { BlockSchemas, LayoutSchemas } from '@cms/ui/schemas'

const BUILD_SERVER_URL = 'http://localhost:2999'

/**
 * POST /api/ai-prompt
 * Thin proxy from the editor frontend to the build server AI route.
 *
 * Enriches the request with serialized schema context (available here via
 * the @cms/ui package) so the build server can embed it in the LLM system prompt.
 *
 * Supports SSE streaming passthrough when the client sends Accept: text/event-stream.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{
    prompt: string
    pageJson: any
    siteId: string
  }>(event)

  const schemaContext = JSON.stringify({ BlockSchemas, LayoutSchemas }, null, 2)
  const acceptHeader = getHeader(event, 'accept') ?? ''
  const wantsStream = acceptHeader.includes('text/event-stream')

  const forwardBody = JSON.stringify({
    prompt: body.prompt,
    pageJson: body.pageJson,
    siteId: body.siteId,
    schemaContext
  })

  if (wantsStream) {
    setHeader(event, 'Content-Type', 'text/event-stream')
    setHeader(event, 'Cache-Control', 'no-cache')
    setHeader(event, 'Connection', 'keep-alive')

    const upstream = await fetch(`${BUILD_SERVER_URL}/api/ai/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream'
      },
      body: forwardBody
    })

    if (!upstream.ok || !upstream.body) {
      throw createError({ statusCode: 502, message: 'Build server AI route unavailable' })
    }

    // Pipe the SSE stream from the build server directly to the client
    return sendStream(event, upstream.body)
  }

  // Non-streaming: regular JSON proxy
  const result = await $fetch<any>(`${BUILD_SERVER_URL}/api/ai/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: forwardBody
  })

  return result
})
