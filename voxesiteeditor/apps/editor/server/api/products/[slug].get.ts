/**
 * GET /api/products/:slug
 * Proxies to the build server for a single product by slug.
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  return $fetch(`http://localhost:2999/api/demosite/products/${slug}`)
})
