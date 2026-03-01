import { createLLMAdapter } from '../llm/factory'
import type { LLMMessage, LLMImageInput } from '../llm/types'

// Minimal local definition matching packages/contracts/page.ts (avoids ESM/CJS cross-import)
interface Page {
  id: string
  slug: string
  title?: string
  seo?: { title: string; description?: string }
  blocks: Array<{ id: string; type: string; props: Record<string, any>; styles?: any; customCss?: string }>
  cssFile?: string
}

// ---------------------------------------------------------------------------
// System prompt helpers
// ---------------------------------------------------------------------------

const PAGE_INTERFACE = `
interface Page {
  id: string
  slug: string
  title?: string
  seo?: { title: string; description?: string }
  blocks: Array<{
    id: string
    type: string   // Must be one of the types listed in the schema registry
    props: Record<string, any>
    styles?: Record<string, Record<string, string>>
    customCss?: string
  }>
}`.trim()

const EXAMPLE_PAGE = JSON.stringify(
  {
    id: 'generated-page-1',
    slug: 'home',
    title: 'Home',
    seo: { title: 'Welcome', description: 'Generated home page' },
    blocks: [
      {
        id: 'block-hero-1',
        type: 'Hero',
        props: {
          title: 'Welcome to Our Site',
          subtitle: 'We help you build amazing things',
          ctaText: 'Get Started',
          ctaHref: '#'
        },
        styles: {}
      },
      {
        id: 'block-text-1',
        type: 'TextBlock',
        props: {
          content: 'Our platform makes it easy to create beautiful websites.'
        },
        styles: {}
      }
    ]
  },
  null,
  2
)

function buildSystemPrompt(schemaContext: string): string {
  return `You are a CMS page generator. Your task is to analyse content (text, DOM structure, or an image) and generate a structured Page JSON object that matches the CMS block schema.

BLOCK SCHEMA REGISTRY (only use types listed here):
${schemaContext}

TARGET TYPESCRIPT INTERFACE:
${PAGE_INTERFACE}

MINIMAL VALID EXAMPLE:
${EXAMPLE_PAGE}

STRICT RULES:
1. Return ONLY a valid JSON object. No markdown fences, no explanation, no code blocks.
2. Only use block "type" values that exist in the schema registry above.
3. Every block must have a unique "id" (use short strings like "hero-1", "text-1").
4. Generate a realistic slug from the page title (lowercase, hyphens only).
5. Map detected content sections to the most appropriate block type.
6. Populate all required props for each block type based on the schema.
7. If no matching block type exists for some content, use "TextBlock" with the text in "content".
8. Do not add extra fields beyond what the Page interface allows.`
}

// ---------------------------------------------------------------------------
// JSON extraction + retry logic
// ---------------------------------------------------------------------------

/**
 * Attempts to extract a valid JSON Page object from an LLM text response.
 * Strips common LLM artifacts like markdown fences.
 */
function extractJson(text: string): Page {
  // Strip markdown fences if present
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()

  return JSON.parse(cleaned) as Page
}

/** Ensures the parsed object has the minimum required Page fields. */
function validatePage(page: any): page is Page {
  return (
    typeof page === 'object' &&
    page !== null &&
    typeof page.id === 'string' &&
    typeof page.slug === 'string' &&
    Array.isArray(page.blocks)
  )
}

// ---------------------------------------------------------------------------
// Public service API
// ---------------------------------------------------------------------------

export interface GeneratePageOptions {
  /** Serialised schema context (BlockSchemas + LayoutSchemas). */
  schemaContext: string
  /** Text input: DOM text, HTML outline, or a description. */
  textInput: string
  /** Optional image for vision-capable models. */
  image?: LLMImageInput
  /**
   * SSE callback — called with each streamed token.
   * When provided the service uses chatStream instead of chat.
   */
  onToken?: (token: string) => void
}

/**
 * Calls the configured LLM adapter to generate a Page JSON object.
 * Performs one automatic retry if the initial response is not valid JSON.
 *
 * @throws When the LLM returns invalid JSON after one retry.
 */
export async function generatePage(opts: GeneratePageOptions): Promise<Page> {
  const { schemaContext, textInput, image, onToken } = opts
  const adapter = createLLMAdapter()

  const messages: LLMMessage[] = [
    { role: 'system', content: buildSystemPrompt(schemaContext) },
    { role: 'user', content: textInput, ...(image ? { image } : {}) }
  ]

  // ── First attempt ──────────────────────────────────────────────────────────
  let rawText: string
  if (onToken) {
    rawText = await adapter.chatStream(messages, onToken)
  } else {
    rawText = await adapter.chat(messages)
  }

  try {
    const page = extractJson(rawText)
    if (!validatePage(page)) throw new Error('Page object missing required fields')
    return page
  } catch {
    // ── Retry with correction prompt ─────────────────────────────────────────
    const retryMessages: LLMMessage[] = [
      ...messages,
      { role: 'assistant', content: rawText },
      {
        role: 'user',
        content:
          'The previous response was not valid JSON. Return only the JSON object, nothing else. No markdown, no code fences, just the raw JSON.'
      }
    ]

    let retryText: string
    if (onToken) {
      retryText = await adapter.chatStream(retryMessages, onToken)
    } else {
      retryText = await adapter.chat(retryMessages)
    }

    try {
      const page = extractJson(retryText)
      if (!validatePage(page)) throw new Error('Page object missing required fields')
      return page
    } catch {
      throw Object.assign(
        new Error('LLM returned invalid JSON after retry'),
        { raw: retryText }
      )
    }
  }
}
