import { defineEventHandler, getRequestURL, getRequestHeader, setResponseHeader } from 'h3'
import { randomBytes } from 'crypto'

/**
 * Generate a cryptographically secure base64url nonce.
 * Inline here to avoid importing from node-build-server across app boundaries.
 */
function generateNonce(): string {
  return randomBytes(16).toString('base64url')
}

/**
 * CSP server middleware — runs on every SSR request.
 *
 * Responsibilities:
 *  1. Generate a fresh nonce (unique per request — never reused, never logged).
 *  2. Detect whether the request originates from the editor iframe.
 *  3. Build and set the Content-Security-Policy response header.
 *  4. Set additional security headers on every response.
 *  5. Store the nonce on event.context.cspNonce so downstream render hooks
 *     and composables (useCspNonce) can attach it to <script> and <style> tags.
 *
 * Editor mode detection:
 *  - Query param ?editor=1  (can be appended by the editor when loading the iframe)
 *  - Referer header pointing to the editor origin (localhost:3000 in dev)
 *
 * frame-ancestors:
 *  - Published pages: 'none'  — prevents clickjacking
 *  - Editor context:  'self'  — allows embedding in the editor iframe
 *
 * connect-src includes ws: and wss: because the runtime connects to
 * the build server WebSocket endpoints for collaborative editing and
 * voice transcription.
 */
export default defineEventHandler((event) => {
  const nonce = generateNonce()

  // Attach nonce to request context so nuxt.config.ts render hook can read it
  // and useCspNonce() composable can expose it to page components.
  event.context.cspNonce = nonce

  // ── Detect editor context ────────────────────────────────────────────────
  const url = getRequestURL(event)
  const referer = getRequestHeader(event, 'referer') ?? ''
  const isEditorMode =
    url.searchParams.get('editor') === '1' ||
    referer.includes(':3000') // editor dev server

  const frameAncestors = isEditorMode ? "'self'" : "'none'"
  const xFrameOptions = isEditorMode ? 'SAMEORIGIN' : 'DENY'

  // ── Build CSP header ─────────────────────────────────────────────────────
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: https:",
    "font-src 'self' https:",
    // ws:/wss: needed for collaborative editing (Yjs) and voice transcription WebSockets
    "connect-src 'self' ws: wss:",
    `frame-ancestors ${frameAncestors}`,
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ]

  // ── Set response headers ─────────────────────────────────────────────────
  setResponseHeader(event, 'Content-Security-Policy', cspDirectives.join('; '))
  setResponseHeader(event, 'X-Content-Type-Options', 'nosniff')
  setResponseHeader(event, 'X-Frame-Options', xFrameOptions)
  setResponseHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin')
  setResponseHeader(event, 'Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
})
