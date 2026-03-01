/**
 * useCspNonce — returns the CSP nonce for the current request.
 *
 * Server-side (SSR):
 *   Reads from the H3 event context populated by the CSP middleware
 *   (apps/runtime/server/middleware/csp.ts).
 *
 * Client-side (after hydration):
 *   Reads from <meta name="csp-nonce"> injected by [slug].vue via useHead().
 *   This allows dynamically created <style> and <script> elements to carry
 *   the matching nonce so the browser CSP check passes.
 *
 * Usage:
 *   const nonce = useCspNonce()
 *   // then: element.nonce = nonce ?? ''
 */
export function useCspNonce(): string | null {
  if (import.meta.server) {
    const event = useRequestEvent()
    return (event?.context?.cspNonce as string | undefined) ?? null
  }

  if (import.meta.client) {
    return (
      document
        .querySelector<HTMLMetaElement>('meta[name="csp-nonce"]')
        ?.content ?? null
    )
  }

  return null
}
