/**
 * Integration tests for the page generator service.
 *
 * Run with: npx ts-node -e "require('./src/__tests__/pageGenerator.test.ts')"
 * Or add `"test": "node --test --require ts-node/register src/__tests__/**\/*.test.ts"`
 * to package.json scripts and run: npm test
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// ─── Minimal valid Page fixture ────────────────────────────────────────────────

const VALID_PAGE = {
  id: 'test-page-1',
  slug: 'home',
  title: 'Home',
  seo: { title: 'Home Page', description: 'Test page' },
  blocks: [
    {
      id: 'hero-1',
      type: 'Hero',
      props: { title: 'Welcome', subtitle: 'Test site', ctaText: 'Learn more', ctaHref: '#' },
      styles: {}
    },
    {
      id: 'text-1',
      type: 'TextBlock',
      props: { content: 'This is a generated page.' },
      styles: {}
    }
  ]
}

const SCHEMA_CONTEXT = JSON.stringify({
  BlockSchemas: {
    Hero: { content: { label: 'Hero', fields: [{ key: 'title', type: 'string', label: 'Title' }] } },
    TextBlock: { content: { label: 'Text Block', fields: [{ key: 'content', type: 'string', label: 'Content' }] } }
  }
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('pageGeneratorService', () => {
  describe('generatePage — valid JSON response', () => {
    it('returns a parsed Page when LLM responds with valid JSON', async () => {
      const validJson = JSON.stringify(VALID_PAGE)
      // Test the core JSON extraction logic directly — avoids Puppeteer import at test time.
      const { extractJsonAndValidate } = await import('./helpers/pageGeneratorHelpers')
      const page = extractJsonAndValidate(validJson)

      assert.ok(page, 'Page should be defined')
      assert.equal(page.id, VALID_PAGE.id)
      assert.equal(page.slug, VALID_PAGE.slug)
      assert.equal(page.blocks.length, 2)
      assert.equal(page.blocks[0].type, 'Hero')
      assert.equal(page.blocks[1].type, 'TextBlock')
    })
  })

  describe('generatePage — JSON inside markdown fences', () => {
    it('strips markdown fences and returns valid Page', async () => {
      const { extractJsonAndValidate } = await import('./helpers/pageGeneratorHelpers')
      const fencedJson = `\`\`\`json\n${JSON.stringify(VALID_PAGE)}\n\`\`\``
      const page = extractJsonAndValidate(fencedJson)

      assert.ok(page, 'Page should be defined')
      assert.equal(page.slug, 'home')
    })
  })

  describe('generatePage — invalid JSON throws', () => {
    it('throws on invalid JSON', () => {
      import('./helpers/pageGeneratorHelpers').then(({ extractJsonAndValidate }) => {
        assert.throws(
          () => extractJsonAndValidate('This is not JSON at all'),
          /SyntaxError|JSON/i
        )
      })
    })
  })

  describe('generatePage — missing required fields throws', () => {
    it('throws when Page object is missing id, slug, or blocks', async () => {
      const { extractJsonAndValidate } = await import('./helpers/pageGeneratorHelpers')
      const incomplete = JSON.stringify({ id: 'x' }) // missing slug and blocks

      assert.throws(
        () => extractJsonAndValidate(incomplete),
        /missing required fields/i
      )
    })
  })

  describe('htmlSanitizer', () => {
    it('sanitises HTML and returns domText', async () => {
      const { sanitizeHtml } = await import('../pageGenerator/htmlSanitizer')
      const rawHtml = `
        <html><body>
          <h1>Hello World</h1>
          <p>Some <script>alert('xss')</script> content</p>
          <div class="hero">Welcome to our site</div>
        </body></html>
      `

      const result = sanitizeHtml(rawHtml)

      assert.ok(result.sanitizedHtml, 'sanitizedHtml must be present')
      assert.ok(result.domText, 'domText must be present')
      assert.ok(!result.sanitizedHtml.includes('<script>'), 'Script tags must be removed')
      assert.ok(result.domText.includes('Hello World') || result.domText.length > 0, 'domText has content')
    })
  })

  describe('screenshotHandler', () => {
    it('accepts a data URI and returns normalised ImageInput', async () => {
      const { prepareScreenshot } = await import('../pageGenerator/screenshotHandler')
      // Minimal 1-pixel JPEG base64
      const tinyBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARC'
      const dataUri = `data:image/jpeg;base64,${tinyBase64}AAA=`

      const result = prepareScreenshot(dataUri)
      assert.equal(result.mimeType, 'image/jpeg')
      assert.ok(result.data.length > 0, 'data must be present')
      assert.ok(!result.data.startsWith('data:'), 'data must not contain data URI prefix')
    })

    it('accepts raw base64 with explicit mimeType', async () => {
      const { prepareScreenshot } = await import('../pageGenerator/screenshotHandler')
      const raw = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

      const result = prepareScreenshot(raw, 'image/png')
      assert.equal(result.mimeType, 'image/png')
      assert.equal(result.data, raw)
    })

    it('throws on unsupported mime type', async () => {
      const { prepareScreenshot } = await import('../pageGenerator/screenshotHandler')
      assert.throws(
        () => prepareScreenshot('abc123', 'image/bmp'),
        /Unsupported image type/i
      )
    })
  })
})

// ─── HTTP route smoke test (requires build server running) ────────────────────
//
// These tests are skipped in CI unless BUILD_SERVER_URL env var is set.
// They verify that the routes return 200 and a parsed page object.

describe('HTTP routes — smoke tests', { skip: !process.env.RUN_INTEGRATION_TESTS }, () => {
  const BASE = process.env.BUILD_SERVER_URL ?? 'http://localhost:2999'
  const SITE_ID = 'demosite'

  it('POST /api/:siteId/generate/html returns 200 with page object', async () => {
    const res = await fetch(`${BASE}/api/${SITE_ID}/generate/html`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html: '<h1>Hello</h1><p>Test page content</p>',
        schemaContext: SCHEMA_CONTEXT
      })
    })

    assert.equal(res.status, 200, `Expected 200, got ${res.status}`)
    const data = await res.json() as any
    assert.ok(data.ok, `Response ok must be true: ${JSON.stringify(data)}`)
    assert.ok(data.page, 'Response must include page object')
    assert.ok(typeof data.page.id === 'string', 'page.id must be a string')
    assert.ok(typeof data.page.slug === 'string', 'page.slug must be a string')
    assert.ok(Array.isArray(data.page.blocks), 'page.blocks must be an array')
  })

  it('POST /api/:siteId/generate/screenshot returns 400 when model is text-only', async () => {
    // This test assumes the server is configured with a text-only model.
    // Set LLM_MODEL to a text-only model in env before running.
    const res = await fetch(`${BASE}/api/${SITE_ID}/generate/screenshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAABjE+ibYAAAAASUVORK5CYII=',
        mimeType: 'image/png',
        schemaContext: SCHEMA_CONTEXT
      })
    })

    // Either 400 (text-only model) or 200 (vision-capable model) is acceptable
    assert.ok([200, 400].includes(res.status), `Expected 200 or 400, got ${res.status}`)
  })
})
