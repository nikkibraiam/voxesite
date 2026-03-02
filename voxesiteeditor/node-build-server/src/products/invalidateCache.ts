/**
 * ISR cache invalidation for product pages.
 *
 * Called server-side from productService.ts after every product update.
 * Notifies the Nuxt runtime to purge the ISR cache for the affected route.
 *
 * Env vars:
 *   RUNTIME_URL           — internal URL of apps/runtime (e.g. http://localhost:3001)
 *   CACHE_PURGE_SECRET    — shared secret between build-server and runtime
 */
export async function invalidateProductCache(
  siteId: string,
  slug: string
): Promise<void> {
  const runtimeUrl = process.env.RUNTIME_URL
  const purgeSecret = process.env.CACHE_PURGE_SECRET

  if (!runtimeUrl || !purgeSecret) {
    // Not configured — skip silently in development environments
    console.warn(
      '[invalidateCache] RUNTIME_URL or CACHE_PURGE_SECRET not set — skipping ISR cache purge'
    )
    return
  }

  const url = `${runtimeUrl}/_nitro/cache/clear`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cache-purge-key': purgeSecret,
    },
    body: JSON.stringify({ keys: [`productos/${slug}`] }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      `[invalidateCache] Cache purge failed for site=${siteId} slug=${slug}: ${response.status} ${text}`
    )
  }

  console.log(
    `[invalidateCache] Cache purged for site=${siteId} slug=${slug}`
  )
}
