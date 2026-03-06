import { readFileSync } from 'fs'
import { join } from 'path'
import { createLLMAdapter } from '../llm/factory'
import type { LLMMessage, LLMImageInput } from '../llm/types'

// Minimal Page type (mirrors packages/contracts/page.ts — avoids ESM/CJS cross-import)
interface Page {
  id: string
  slug: string
  title?: string
  seo?: { title: string; description?: string }
  blocks: Array<{ id: string; type: string; props: Record<string, any>; styles?: any; customCss?: string }>
  cssFile?: string
}

/**
 * Loads and caches the site-clone-agent.xml system prompt from .claude/prompts/.
 * Falls back to a minimal inline prompt if the file cannot be read.
 */
function loadAgentPrompt(): string {
  try {
    const promptPath = join(__dirname, '../../../../.claude/prompts/site-clone-agent.xml')
    return readFileSync(promptPath, 'utf-8')
  } catch {
    return `You are a CMS page generator. Analyse the provided web page content and return a valid Page JSON object. Return ONLY raw JSON, no markdown.`
  }
}

function buildSystemPrompt(schemaContext: string): string {
  const base = loadAgentPrompt()
  return base.replace('{{BLOCK_REGISTRY}}', schemaContext)
}

function extractJson(text: string): Page {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()
  return JSON.parse(cleaned) as Page
}

function validatePage(page: any): page is Page {
  return (
    typeof page === 'object' &&
    page !== null &&
    typeof page.id === 'string' &&
    typeof page.slug === 'string' &&
    Array.isArray(page.blocks)
  )
}

export interface SiteCloneOptions {
  schemaContext: string
  textInput: string
  image?: LLMImageInput
  onToken?: (token: string) => void
}

/**
 * VoxeSiteCloneAgent — wraps the LLM with a structured prompt for URL/screenshot-to-page cloning.
 * Provides one automatic JSON extraction retry on parse failure.
 */
export async function runSiteCloneAgent(opts: SiteCloneOptions): Promise<Page> {
  const { schemaContext, textInput, image, onToken } = opts
  const adapter = createLLMAdapter()

  const messages: LLMMessage[] = [
    { role: 'system', content: buildSystemPrompt(schemaContext) },
    { role: 'user', content: textInput, ...(image ? { image } : {}) }
  ]

  let rawText: string
  if (onToken) {
    rawText = await adapter.chatStream(messages, onToken)
  } else {
    rawText = await adapter.chat(messages)
  }

  try {
    const page = extractJson(rawText)
    if (!validatePage(page)) throw new Error('Page missing required fields')
    return page
  } catch {
    // One retry with explicit correction prompt
    const retryMessages: LLMMessage[] = [
      ...messages,
      { role: 'assistant', content: rawText },
      { role: 'user', content: 'The previous response was not valid JSON. Return only the JSON object, nothing else.' }
    ]

    let retryText: string
    if (onToken) {
      retryText = await adapter.chatStream(retryMessages, onToken)
    } else {
      retryText = await adapter.chat(retryMessages)
    }

    try {
      const page = extractJson(retryText)
      if (!validatePage(page)) throw new Error('Page missing required fields after retry')
      return page
    } catch {
      throw Object.assign(new Error('SiteCloneAgent: invalid JSON after retry'), { raw: retryText })
    }
  }
}
