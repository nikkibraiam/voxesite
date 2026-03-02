/**
 * GET /api/products
 * Proxies to the build server product list endpoint.
 * Query params: page, limit, category
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  return $fetch('http://localhost:2999/api/demosite/products', { query })
})
