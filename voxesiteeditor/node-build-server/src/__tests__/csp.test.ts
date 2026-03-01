/**
 * Unit tests for CSP nonce generation and header building.
 *
 * Run with: npm test
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { generateNonce, buildCspHeader } from '../security/nonceGenerator'

// ─── generateNonce ────────────────────────────────────────────────────────────

describe('generateNonce', () => {
  it('returns a non-empty string', () => {
    const nonce = generateNonce()
    assert.ok(typeof nonce === 'string' && nonce.length > 0, 'nonce must be a non-empty string')
  })

  it('returns a base64url string (no +, /, or = characters)', () => {
    const nonce = generateNonce()
    assert.doesNotMatch(nonce, /[+/=]/, 'nonce must use base64url encoding (no +, /, =)')
  })

  it('returns at least 16 bytes of entropy (≥ 22 base64url chars)', () => {
    // 16 bytes → 22 base64url chars (ceiling(16 * 8 / 6))
    const nonce = generateNonce()
    assert.ok(nonce.length >= 22, `nonce length ${nonce.length} must be ≥ 22`)
  })

  it('generates unique nonces on each call', () => {
    const nonces = new Set(Array.from({ length: 20 }, () => generateNonce()))
    assert.equal(nonces.size, 20, 'All 20 generated nonces must be unique')
  })
})

// ─── buildCspHeader ───────────────────────────────────────────────────────────

describe('buildCspHeader', () => {
  it('contains the nonce in script-src and style-src', () => {
    const nonce = 'test-nonce-abc123'
    const csp = buildCspHeader(nonce)

    assert.ok(csp.includes(`'nonce-${nonce}'`), `CSP must include 'nonce-${nonce}'`)
    assert.ok(csp.includes('script-src'), 'CSP must include script-src directive')
    assert.ok(csp.includes('style-src'), 'CSP must include style-src directive')
  })

  it('defaults to frame-ancestors \'none\' when no context is given', () => {
    const csp = buildCspHeader('nonce-x')
    assert.ok(csp.includes("frame-ancestors 'none'"), "Default CSP must have frame-ancestors 'none'")
  })

  it("uses frame-ancestors 'none' for context='published'", () => {
    const csp = buildCspHeader('nonce-x', { context: 'published' })
    assert.ok(csp.includes("frame-ancestors 'none'"), "Published CSP must have frame-ancestors 'none'")
    assert.ok(!csp.includes("frame-ancestors 'self'"), "Published CSP must NOT have frame-ancestors 'self'")
  })

  it("uses frame-ancestors 'self' for context='editor'", () => {
    const csp = buildCspHeader('nonce-x', { context: 'editor' })
    assert.ok(csp.includes("frame-ancestors 'self'"), "Editor CSP must have frame-ancestors 'self'")
    assert.ok(!csp.includes("frame-ancestors 'none'"), "Editor CSP must NOT have frame-ancestors 'none'")
  })

  it('includes all baseline directives', () => {
    const csp = buildCspHeader('nonce-x')
    const requiredDirectives = [
      'default-src',
      'script-src',
      'style-src',
      'img-src',
      'font-src',
      'connect-src',
      'frame-ancestors',
      'base-uri',
      'form-action',
      'upgrade-insecure-requests',
    ]
    for (const directive of requiredDirectives) {
      assert.ok(csp.includes(directive), `CSP must include '${directive}'`)
    }
  })

  it('does not include unsafe-inline or unsafe-eval', () => {
    const csp = buildCspHeader('nonce-x')
    assert.ok(!csp.includes("'unsafe-inline'"), "CSP must not include 'unsafe-inline'")
    assert.ok(!csp.includes("'unsafe-eval'"), "CSP must not include 'unsafe-eval'")
  })

  it('merges extraDirectives, overriding the base value', () => {
    const csp = buildCspHeader('nonce-x', {
      extraDirectives: { 'connect-src': ["'self'", 'ws:', 'wss:'] },
    })
    assert.ok(csp.includes("connect-src 'self' ws: wss:"), 'Merged connect-src must include ws: wss:')
  })

  it('formats upgrade-insecure-requests as a bare keyword (no value)', () => {
    const csp = buildCspHeader('nonce-x')
    // Must appear as standalone keyword, not "upgrade-insecure-requests <something>"
    assert.match(csp, /upgrade-insecure-requests(?:;|$)/)
  })
})
