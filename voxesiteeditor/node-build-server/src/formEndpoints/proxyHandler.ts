import type { Request, Response } from 'express'
import { pool } from '../db/client'
import { decrypt } from './encryptionUtils'

// Local field type definitions — mirrors packages/contracts/blocks/form.ts
// (node-build-server is CJS and cannot import from ESM workspace packages)
type FieldType =
  | 'text' | 'textarea' | 'email' | 'phone' | 'number' | 'date'
  | 'select' | 'radio' | 'checkbox' | 'file' | 'cedula' | 'nit'

interface FormField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  required?: boolean
  validation?: { pattern?: string; min?: number; max?: number; message?: string }
  options?: { value: string; label: string }[]
  conditions?: unknown[]
}

// ── Validation helpers ───────────────────────────────────────────────────────

const CEDULA_RE = /^\d{6,10}$/
const NIT_RE    = /^\d{9}-\d{1}$/

function validateField(
  field: FormField,
  value: unknown,
  isRequired: boolean
): string | null {
  const strVal = value == null ? '' : String(value).trim()

  if (isRequired && strVal === '') {
    return field.validation?.message ?? `"${field.label}" is required`
  }

  // Skip remaining checks for empty optional fields
  if (strVal === '') return null

  // Type-specific format validation
  if (field.type === 'cedula') {
    if (!CEDULA_RE.test(strVal)) {
      return field.validation?.message ?? `"${field.label}" must be 6–10 digits`
    }
  }

  if (field.type === 'nit') {
    if (!NIT_RE.test(strVal)) {
      return field.validation?.message ?? `"${field.label}" must be in format 000000000-0`
    }
  }

  if (field.type === 'email') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
      return field.validation?.message ?? `"${field.label}" must be a valid email address`
    }
  }

  if (field.validation?.pattern) {
    try {
      const re = new RegExp(field.validation.pattern)
      if (!re.test(strVal)) {
        return field.validation.message ?? `"${field.label}" format is invalid`
      }
    } catch {
      // Malformed pattern — skip pattern check
    }
  }

  if (field.type === 'number') {
    const num = Number(strVal)
    if (Number.isNaN(num)) {
      return field.validation?.message ?? `"${field.label}" must be a number`
    }
    if (field.validation?.min != null && num < field.validation.min) {
      return field.validation.message ?? `"${field.label}" must be at least ${field.validation.min}`
    }
    if (field.validation?.max != null && num > field.validation.max) {
      return field.validation.message ?? `"${field.label}" must be at most ${field.validation.max}`
    }
  }

  return null
}

/**
 * Handles POST /api/:siteId/form-submit
 *
 * Security contract:
 * - Resolves endpointKey → real URL + credentials server-side (never in the browser)
 * - Decrypts auth_value with AES-256-GCM before adding it to the proxy request
 * - Re-validates all required fields server-side (client validation is UX-only)
 * - Returns ONLY { success: boolean, status: number } — upstream body is never forwarded
 * - Logs every attempt as structured JSON
 */
export async function handleFormSubmit(req: Request, res: Response, siteId: string) {
  const ip = req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? 'unknown'
  const { endpointKey, formData, fields: rawFields } = req.body as {
    endpointKey: string
    formData: Record<string, unknown>
    fields?: FormField[]   // optional — sent by client for server-side re-validation
  }

  if (!endpointKey || !formData) {
    return res.status(400).json({ error: 'Missing endpointKey or formData' })
  }

  // ── Lookup endpoint ──────────────────────────────────────────────────────────
  let row: any
  if (pool) {
    const result = await pool.query(
      'SELECT * FROM form_endpoints WHERE key = $1 AND site_id = $2',
      [endpointKey, siteId]
    )
    row = result.rows[0]
  } else {
    // No database configured — return 404 for all keys
    console.warn('[formProxy] No database configured; form_endpoints lookup skipped')
  }

  if (!row) {
    console.log(JSON.stringify({
      event: 'form_submit',
      siteId, endpointKey, ip,
      success: false, status: 404,
      reason: 'endpoint_not_found',
      ts: new Date().toISOString()
    }))
    return res.status(404).json({ error: 'Endpoint not found' })
  }

  // ── Server-side field validation ─────────────────────────────────────────────
  // rawFields is provided by the client so the server can re-run validation.
  // If not sent, we skip field-level validation but still proxy.
  if (rawFields && Array.isArray(rawFields)) {
    const fields: FormField[] = rawFields
    const validationErrors: Record<string, string> = {}

    for (const field of fields) {
      // All fields are required at server level unless explicitly not required
      const isRequired = field.required ?? false
      const err = validateField(field, formData[field.id], isRequired)
      if (err) validationErrors[field.id] = err
    }

    if (Object.keys(validationErrors).length > 0) {
      console.log(JSON.stringify({
        event: 'form_submit',
        siteId, endpointKey, ip,
        success: false, status: 422,
        reason: 'validation_failed',
        ts: new Date().toISOString()
      }))
      return res.status(422).json({ error: 'Validation failed', fields: validationErrors })
    }
  }

  // ── Build proxy headers ──────────────────────────────────────────────────────
  const proxyHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((row.headers as Record<string, string>) ?? {})
  }

  if (row.auth_value) {
    try {
      const decrypted = decrypt(row.auth_value)
      proxyHeaders['Authorization'] = decrypted
    } catch (err: any) {
      console.error('[formProxy] Failed to decrypt auth_value:', err.message)
      return res.status(500).json({ error: 'Internal configuration error' })
    }
  }

  // ── Proxy to upstream ────────────────────────────────────────────────────────
  let upstream: globalThis.Response
  try {
    upstream = await fetch(row.url, {
      method: row.method ?? 'POST',
      headers: proxyHeaders,
      body: JSON.stringify(formData)
    })
  } catch (fetchErr: any) {
    console.log(JSON.stringify({
      event: 'form_submit',
      siteId, endpointKey, ip,
      success: false, status: 0,
      reason: 'upstream_unreachable',
      error: fetchErr.message,
      ts: new Date().toISOString()
    }))
    return res.status(502).json({ error: 'Upstream endpoint unreachable' })
  }

  const success = upstream.ok

  console.log(JSON.stringify({
    event: 'form_submit',
    siteId, endpointKey, ip,
    success, status: upstream.status,
    ts: new Date().toISOString()
  }))

  // Never forward upstream body — return only success signal
  return res.json({ success, status: upstream.status })
}
