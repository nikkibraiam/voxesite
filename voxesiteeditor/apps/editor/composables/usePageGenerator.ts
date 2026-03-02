import { ref } from 'vue'
import { usePageStore } from '../stores/usePageStore'
import type { Page } from '@cms/contracts'

export type GenerateTab = 'url' | 'screenshot' | 'html'

// ── Singleton state — shared across ALL callers of usePageGenerator() ─────────
// index.vue holds the ⚡ open button; GeneratePageModal.vue holds the v-if and
// form inputs. Both call this composable, so they MUST share the same refs.
const isModalOpen = ref(false)
const activeTab = ref<GenerateTab>('url')

const isGenerating = ref(false)
const generateError = ref<string | null>(null)
const streamedTokens = ref('')

// ── Per-tab inputs ─────────────────────────────────────────────────────────
const urlInput = ref('')
const htmlInput = ref('')
const screenshotFile = ref<File | null>(null)

/**
 * Manages the Generate Page modal and the three generation flows.
 *
 * Each flow calls the corresponding Nuxt API proxy which forwards to the
 * build server with enriched schema context. All flows support SSE streaming
 * so the user sees token-by-token output during generation.
 */
export function usePageGenerator() {
  const store = usePageStore()

  // ── Modal controls ─────────────────────────────────────────────────────────
  function openModal(tab?: GenerateTab) {
    activeTab.value = tab ?? 'url'
    generateError.value = null
    streamedTokens.value = ''
    isModalOpen.value = true
  }

  function closeModal() {
    isModalOpen.value = false
  }

  // ── Generation: URL ────────────────────────────────────────────────────────
  async function generateFromUrl() {
    if (!urlInput.value.trim()) return
    await _runGeneration('/api/generate-url', { url: urlInput.value.trim(), siteId: 'demosite' })
  }

  // ── Generation: Screenshot ─────────────────────────────────────────────────
  async function generateFromScreenshot() {
    if (!screenshotFile.value) return

    const file = screenshotFile.value
    const base64 = await _fileToBase64(file)

    await _runGeneration('/api/generate-screenshot', {
      image: base64,
      mimeType: file.type,
      siteId: 'demosite'
    })
  }

  // ── Generation: HTML ───────────────────────────────────────────────────────
  async function generateFromHtml() {
    if (!htmlInput.value.trim()) return
    await _runGeneration('/api/generate-html', { html: htmlInput.value.trim(), siteId: 'demosite' })
  }

  // ── Internal: shared streaming fetch ──────────────────────────────────────

  async function _runGeneration(endpoint: string, body: Record<string, any>) {
    isGenerating.value = true
    generateError.value = null
    streamedTokens.value = ''

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream'
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
        throw new Error(errData.error ?? errData.message ?? `HTTP ${response.status}`)
      }

      if (!response.body) throw new Error('El servidor no devolvió respuesta')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue
          const dataStr = trimmed.slice(6)
          if (!dataStr) continue

          let data: { token?: string; done?: boolean; page?: any; error?: string; raw?: string }
          try {
            data = JSON.parse(dataStr)
          } catch {
            continue
          }

          if (data.token) {
            streamedTokens.value += data.token
          }

          if (data.error) {
            generateError.value = data.error
            if (data.raw) {
              console.error('[usePageGenerator] raw LLM output:', data.raw)
            }
          }

          if (data.done && data.page) {
            _applyGeneratedPage(store, data.page)
          }
        }
      }
    } catch (err: any) {
      generateError.value = err.message ?? 'Error desconocido al generar la página'
    } finally {
      isGenerating.value = false
    }
  }

  function _applyGeneratedPage(store: ReturnType<typeof usePageStore>, page: Page) {
    // Ensure the page has a unique ID to avoid collisions with existing pages
    const newPage: Page = {
      ...page,
      id: crypto.randomUUID(),
      slug: _uniqueSlug(store, page.slug ?? 'generated-page')
    }

    store.addPage(newPage)
    closeModal()
    streamedTokens.value = ''
  }

  function _uniqueSlug(store: ReturnType<typeof usePageStore>, base: string): string {
    const existing = new Set((store.site?.pages ?? []).map(p => p.slug))
    if (!existing.has(base)) return base

    let i = 2
    while (existing.has(`${base}-${i}`)) i++
    return `${base}-${i}`
  }

  async function _fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Return full data URI — the server's prepareScreenshot() handles stripping it
        resolve(result)
      }
      reader.onerror = () => reject(new Error('Failed to read image file'))
      reader.readAsDataURL(file)
    })
  }

  return {
    // Modal state
    isModalOpen,
    activeTab,
    openModal,
    closeModal,
    // Generation state
    isGenerating,
    generateError,
    streamedTokens,
    // Inputs
    urlInput,
    htmlInput,
    screenshotFile,
    // Actions
    generateFromUrl,
    generateFromScreenshot,
    generateFromHtml
  }
}
