/**
 * Idempotent database migration script.
 *
 * Run with:   npm run migrate
 * Requires:   DATABASE_URL environment variable pointing to a Postgres instance.
 *
 * Creates the following tables if they don't already exist:
 *   sites          — one row per site (JSON + Yjs collab state)
 *   site_versions  — published version snapshots for rollback
 */
import { Pool } from 'pg'

async function migrate() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('[migrate] DATABASE_URL is not set. Cannot run migrations.')
    process.exit(1)
  }

  const pool = new Pool({ connectionString: url })

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sites (
        id           TEXT PRIMARY KEY,
        data         JSONB NOT NULL,
        collab_state BYTEA,
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)
    console.log('[migrate] Table "sites" — OK')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_versions (
        id           SERIAL PRIMARY KEY,
        site_id      TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
        version      TEXT NOT NULL,
        data         JSONB NOT NULL,
        published_at TIMESTAMPTZ,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(site_id, version)
      );
    `)
    console.log('[migrate] Table "site_versions" — OK')

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_site_versions_site_id
        ON site_versions (site_id, published_at DESC);
    `)
    console.log('[migrate] Index on "site_versions" — OK')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS form_endpoints (
        key             TEXT PRIMARY KEY,
        site_id         TEXT NOT NULL,
        url             TEXT NOT NULL,
        method          TEXT NOT NULL DEFAULT 'POST',
        headers         JSONB DEFAULT '{}',
        auth_value      TEXT,
        rate_config     JSONB,
        allowed_origins TEXT[],
        created_at      TIMESTAMPTZ DEFAULT now(),
        updated_at      TIMESTAMPTZ DEFAULT now()
      );
    `)
    console.log('[migrate] Table "form_endpoints" — OK')

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_form_endpoints_site_id
        ON form_endpoints (site_id);
    `)
    console.log('[migrate] Index on "form_endpoints" — OK')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        site_id     TEXT NOT NULL,
        slug        TEXT NOT NULL,
        data        JSONB NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (site_id, slug)
      );
    `)
    console.log('[migrate] Table "products" — OK')

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_products_site_id
        ON products (site_id);
    `)
    console.log('[migrate] Index "idx_products_site_id" — OK')

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_products_slug
        ON products (site_id, slug);
    `)
    console.log('[migrate] Index "idx_products_slug" — OK')

    console.log('[migrate] All migrations complete.')
  } catch (err) {
    console.error('[migrate] Migration failed:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

migrate()
