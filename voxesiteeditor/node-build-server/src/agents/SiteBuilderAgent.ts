import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Loads and caches the site-builder-agent.xml system prompt from .claude/prompts/.
 * Falls back to a minimal inline prompt if the file cannot be read.
 */
function loadAgentPrompt(): string {
  try {
    const promptPath = join(__dirname, '../../../../.claude/prompts/site-builder-agent.xml')
    return readFileSync(promptPath, 'utf-8')
  } catch {
    return `You are a CMS block editor assistant. Return the complete updated Page JSON. Return ONLY raw JSON, no markdown.`
  }
}

/**
 * Builds the system prompt for the AI Panel.
 *
 * @param schemaContext - Serialised BlockSchemas + LayoutSchemas from @cms/ui
 * @param pageJson - The current page JSON being edited
 */
export function buildSiteBuilderPrompt(schemaContext: string, pageJson: any): string {
  const base = loadAgentPrompt()
  return base
    .replace('{{BLOCK_REGISTRY}}', schemaContext)
    .replace('{{CURRENT_PAGE}}', JSON.stringify(pageJson, null, 2))
    // SNEAKER_STORE_EXAMPLE and COURSES_PAGE_EXAMPLE are injected by /generate-agent-examples
    // If still placeholders, replace with empty string so they don't confuse the LLM
    .replace(/\{\{SNEAKER_STORE_EXAMPLE\}\}/g, '')
    .replace(/\{\{COURSES_PAGE_EXAMPLE\}\}/g, '')
}
