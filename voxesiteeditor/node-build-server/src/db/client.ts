import { Pool } from 'pg'

/**
 * Singleton pg Pool.
 *
 * Reads DATABASE_URL from environment. If not set, `pool` is null and callers
 * must fall back to the filesystem persistence layer.
 */
let pool: Pool | null = null

if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL })

  pool.on('error', (err) => {
    console.error('[db] Unexpected pool error:', err)
  })

  console.log('[db] PostgreSQL pool initialized')
} else {
  console.warn('[db] DATABASE_URL not set — using filesystem persistence (run `npm run migrate` after setting it)')
}

export { pool }
