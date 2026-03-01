import DOMPurify from 'isomorphic-dompurify'
import { JSDOM } from 'jsdom'

export interface SanitizeResult {
  sanitizedHtml: string
  domText: string
}

/**
 * Sanitises raw HTML server-side using DOMPurify+jsdom and produces a simplified
 * text representation of the visible DOM for use as LLM context.
 */
export function sanitizeHtml(rawHtml: string): SanitizeResult {
  // Sanitise: removes scripts, event handlers, and other dangerous content
  const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
    FORBID_TAGS: ['script', 'style', 'noscript', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['style', 'on*'],
    KEEP_CONTENT: true
  })

  // Parse into a DOM so we can extract a text outline
  const dom = new JSDOM(sanitizedHtml)
  const document = dom.window.document
  const body = document.body ?? document.documentElement

  const domText = extractDomText(body, 0).slice(0, 8_000)

  return { sanitizedHtml, domText }
}

function extractDomText(el: Element, depth: number): string {
  if (depth > 6) return ''
  const tag = el.tagName.toLowerCase()

  if (['script', 'style', 'noscript'].includes(tag)) return ''

  const indent = '  '.repeat(depth)
  const textContent = el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 120) ?? ''
  const label = textContent
    ? `${indent}<${tag}> ${textContent}`
    : `${indent}<${tag}>`

  const children = Array.from(el.children)
    .map(child => extractDomText(child, depth + 1))
    .filter(Boolean)
    .join('\n')

  return children ? `${label}\n${children}` : label
}
