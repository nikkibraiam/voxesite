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

    console.log('[migrate] All migrations complete.')
  } catch (err) {
    console.error('[migrate] Migration failed:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

migrate()
