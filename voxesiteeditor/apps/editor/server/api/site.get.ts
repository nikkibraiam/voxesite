/**
 * GET /api/site
 * Proxies to the build server and returns the full Site JSON.
 * On first load, the build server auto-migrates legacy per-page files.
 */
export default defineEventHandler(async () => {
  try {
    return await $fetch('http://localhost:2999/api/demosite/site')
  } catch (e: any) {
    // 404 means no site exists yet — return null so the editor starts empty
    if (e.status === 404 || e.statusCode === 404) {
      return { ok: false, data: null }
    }
    throw e
  }
})
