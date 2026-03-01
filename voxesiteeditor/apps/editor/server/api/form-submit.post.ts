const BUILD_SERVER_URL = 'http://localhost:2999'

/**
 * POST /api/form-submit
 * Body: { endpointKey: string, formData: Record<string, unknown>, fields?: FormField[] }
 *
 * Thin proxy to build server's secure form submission route.
 * The real endpoint URL is resolved server-side — it never reaches the browser.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{
    endpointKey: string
    formData: Record<string, unknown>
    fields?: unknown[]
    siteId?: string
  }>(event)

  if (!body.endpointKey || !body.formData) {
    throw createError({ statusCode: 400, message: 'endpointKey and formData are required' })
  }

  const siteId = body.siteId ?? useRuntimeConfig().public.siteId ?? 'demosite'

  const result = await $fetch<{ success: boolean; status: number }>(
    `${BUILD_SERVER_URL}/api/${siteId}/form-submit`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpointKey: body.endpointKey,
        formData: body.formData,
        fields: body.fields
      })
    }
  )

  return result
})
