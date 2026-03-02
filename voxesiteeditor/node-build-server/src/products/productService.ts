/**
 * Product CRUD service.
 *
 * All queries use the singleton pg Pool from db/client.ts.
 * Note: node-build-server cannot import from @cms/contracts (CJS/ESM boundary),
 * so we mirror the Product type locally here.
 */
import { pool } from '../db/client'
import { invalidateProductCache } from './invalidateCache'

// Local mirror of packages/contracts/product.ts — keep in sync
export interface Product {
  id: string
  slug: string
  name: string
  description: string
  price: number
  originalPrice?: number
  currency: string
  images: string[]
  category: string
  tags: string[]
  stock?: number
  sku?: string
  seo?: {
    title: string
    description: string
    ogImage?: string
  }
  attributes?: Record<string, string>
  relatedProductIds?: string[]
}

export interface ListProductsOptions {
  page?: number
  limit?: number
  category?: string
}

export interface ProductListResult {
  products: Product[]
  total: number
  page: number
  limit: number
}

/**
 * List all products for a site with optional pagination and category filter.
 */
export async function listProducts(
  siteId: string,
  options: ListProductsOptions = {}
): Promise<ProductListResult> {
  if (!pool) throw new Error('Database not configured')

  const { page = 1, limit = 20, category } = options
  const offset = (page - 1) * limit

  const conditions = ['site_id = $1']
  const params: any[] = [siteId]

  if (category) {
    params.push(category)
    conditions.push(`data->>'category' = $${params.length}`)
  }

  const where = conditions.join(' AND ')

  const [dataResult, countResult] = await Promise.all([
    pool.query(
      `SELECT data FROM products WHERE ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    pool.query(`SELECT COUNT(*) FROM products WHERE ${where}`, params)
  ])

  return {
    products: dataResult.rows.map((r) => r.data as Product),
    total: parseInt(countResult.rows[0].count, 10),
    page,
    limit,
  }
}

/**
 * Fetch a single product by slug.
 * Returns null when not found.
 */
export async function getProductBySlug(
  siteId: string,
  slug: string
): Promise<Product | null> {
  if (!pool) throw new Error('Database not configured')

  const result = await pool.query(
    'SELECT data FROM products WHERE site_id = $1 AND slug = $2',
    [siteId, slug]
  )

  return result.rows.length > 0 ? (result.rows[0].data as Product) : null
}

/**
 * Fetch all products in a given category (by category slug / name).
 */
export async function getProductsByCategory(
  siteId: string,
  categorySlug: string
): Promise<Product[]> {
  if (!pool) throw new Error('Database not configured')

  const result = await pool.query(
    `SELECT data FROM products WHERE site_id = $1 AND data->>'category' = $2 ORDER BY created_at DESC`,
    [siteId, categorySlug]
  )

  return result.rows.map((r) => r.data as Product)
}

/**
 * Create a new product.
 * `data.id` is set by the DB default (gen_random_uuid()); the returned product
 * includes the assigned id.
 */
export async function createProduct(
  siteId: string,
  data: Omit<Product, 'id'>
): Promise<Product> {
  if (!pool) throw new Error('Database not configured')

  const result = await pool.query(
    `INSERT INTO products (site_id, slug, data)
     VALUES ($1, $2, $3)
     RETURNING id, data`,
    [siteId, data.slug, JSON.stringify(data)]
  )

  const row = result.rows[0]
  // Store the generated id inside the JSONB data for convenience
  const product: Product = { ...row.data, id: row.id }

  // Persist the id into the JSONB column as well
  await pool.query('UPDATE products SET data = $1 WHERE id = $2', [
    JSON.stringify(product),
    row.id,
  ])

  return product
}

/**
 * Update an existing product by id.
 * Calls ISR cache invalidation after a successful update.
 */
export async function updateProduct(
  siteId: string,
  id: string,
  updates: Partial<Omit<Product, 'id'>>
): Promise<Product> {
  if (!pool) throw new Error('Database not configured')

  // Fetch current state
  const current = await pool.query(
    'SELECT data FROM products WHERE id = $1 AND site_id = $2',
    [id, siteId]
  )

  if (current.rows.length === 0) {
    throw new Error(`Product ${id} not found for site ${siteId}`)
  }

  const merged: Product = { ...current.rows[0].data, ...updates, id }

  await pool.query(
    'UPDATE products SET data = $1, slug = $2, updated_at = NOW() WHERE id = $3 AND site_id = $4',
    [JSON.stringify(merged), merged.slug, id, siteId]
  )

  // Invalidate ISR cache for this product's slug
  await invalidateProductCache(siteId, merged.slug).catch((err) => {
    // Non-fatal: log but don't fail the update
    console.warn('[productService] Cache invalidation failed:', err.message)
  })

  return merged
}
