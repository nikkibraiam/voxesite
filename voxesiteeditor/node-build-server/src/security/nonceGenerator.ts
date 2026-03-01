import { randomBytes } from 'crypto'

/**
 * Generate a cryptographically secure random nonce for CSP.
 *
 * Returns 16 random bytes encoded as base64url (URL-safe, no padding).
 * Must be unique per HTTP request — never reused, never logged.
 */
export function generateNonce(): string {
  return randomBytes(16).toString('base64url')
}

export interface CspOptions {
  /**
   * Rendering context controls frame-ancestors:
   *  - 'published' (default): frame-ancestors 'none'  — standalone published page
   *  - 'editor':              frame-ancestors 'self'   — embedded in editor iframe
   */
  context?: 'editor' | 'published'
  /** Additional directives merged on top of the baseline (values joined with spaces). */
  extraDirectives?: Record<string, string[]>
}

/**
 * Build a full Content-Security-Policy header string from a nonce and options.
 *
 * Baseline directives follow Mozilla Observatory A+ requirements:
 *   default-src 'self'
 *   script-src  'self' 'nonce-{nonce}'
 *   style-src   'self' 'nonce-{nonce}'
 *   img-src     'self' data: https:
 *   font-src    'self' https:
 *   connect-src 'self'
 *   frame-ancestors 'none' | 'self'  (controlled by context option)
 *   base-uri    'self'
 *   form-action 'self'
 *   upgrade-insecure-requests
 *
 * @param nonce   A value previously returned by generateNonce()
 * @param options Optional context and extra directives
 */
export function buildCspHeader(nonce: string, options: CspOptions = {}): string {
  const { context = 'published', extraDirectives = {} } = options
  const frameAncestors = context === 'editor' ? "'self'" : "'none'"

  const base: Record<string, string> = {
    'default-src': "'self'",
    'script-src': `'self' 'nonce-${nonce}'`,
    'style-src': `'self' 'nonce-${nonce}'`,
    'img-src': "'self' data: https:",
    'font-src': "'self' https:",
    'connect-src': "'self'",
    'frame-ancestors': frameAncestors,
    'base-uri': "'self'",
    'form-action': "'self'",
    // Directive with no value — written as bare keyword
    'upgrade-insecure-requests': '',
  }

  // Merge caller-supplied directives (overrides base values)
  for (const [key, values] of Object.entries(extraDirectives)) {
    base[key] = values.join(' ')
  }

  return Object.entries(base)
    .map(([key, value]) => (value ? `${key} ${value}` : key))
    .join('; ')
}
