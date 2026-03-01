/**
 * Test-only helpers that expose the internal JSON extraction logic
 * from pageGeneratorService without importing Puppeteer or the LLM adapter.
 */

interface Page {
  id: string
  slug: string
  title?: string
  seo?: { title: string; description?: string }
  blocks: Array<{ id: string; type: string; props: Record<string, any> }>
}

/**
 * Strips markdown fences and parses a JSON string into a Page object.
 * Mirrors the logic in pageGeneratorService.ts so we can test it in isolation.
 * Throws SyntaxError on invalid JSON or Error on missing required Page fields.
 */
export function extractJsonAndValidate(text: string): Page {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()

  const parsed = JSON.parse(cleaned)

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof parsed.id !== 'string' ||
    typeof parsed.slug !== 'string' ||
    !Array.isArray(parsed.blocks)
  ) {
    throw new Error('Page object missing required fields (id, slug, blocks)')
  }

  return parsed as Page
}
