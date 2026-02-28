import { ref, toRaw, useTemplateRef } from 'vue'
import { usePageStore } from '../stores/usePageStore'
import { sendEditorMessage } from '@cms/contracts'
import type { Page } from '@cms/contracts'

const RUNTIME_ORIGIN = 'http://localhost:3001'
const MAX_HISTORY = 50

/**
 * Manages the AI Prompt Space panel.
 *
 * Requires `<iframe ref="previewFrame" />` in the consuming component's template
 * so it can send AI_PATCH messages to the runtime for live preview.
 */
export function useAiEditor() {
  const store = usePageStore()
  const previewFrame = useTemplateRef<HTMLIFrameElement>('previewFrame')

  const isAiPanelOpen = ref(false)
  const aiPrompt = ref('')
  const isLoading = ref(false)
  const aiError = ref<string | null>(null)
  /** Accumulates streamed tokens during a streaming LLM response. */
  const streamedTokens = ref('')

  function toggleAiPanel() {
    isAiPanelOpen.value = !isAiPanelOpen.value
  }

  /**
   * Submit the current prompt to the AI.
   * Uses SSE streaming — tokens appear in `streamedTokens` as they arrive.
   * On completion, the full page JSON is parsed and applied via `store.setPage()`.
   * A history snapshot is pushed manually before the mutation so Ctrl+Z works.
   */
  async function submitPrompt() {
    if (!aiPrompt.value.trim() || !store.currentPage) return

    isLoading.value = true
    aiError.value = null
    streamedTokens.value = ''

    try {
      const response = await fetch('/api/ai-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream'
        },
        body: JSON.stringify({
          prompt: aiPrompt.value,
          pageJson: toRaw(store.currentPage),
          siteId: 'demosite'
        })
      })

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('El servidor no devolvió respuesta')
      }

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

          let data: { token?: string; done?: boolean; text?: string; error?: string }
          try {
            data = JSON.parse(dataStr)
          } catch {
            continue
          }

          if (data.token) {
            streamedTokens.value += data.token
          }

          if (data.error) {
            aiError.value = data.error
          }

          if (data.done) {
            _applyAiResult(data.text ?? streamedTokens.value)
          }
        }
      }
    } catch (err: any) {
      aiError.value = err.message ?? 'Error desconocido al conectar con la IA'
    } finally {
      isLoading.value = false
    }
  }

  function clearPrompt() {
    aiPrompt.value = ''
    aiError.value = null
    streamedTokens.value = ''
  }

  // ─── Internal helpers ────────────────────────────────────────────────────────

  function _applyAiResult(text: string) {
    let page: Page
    try {
      page = JSON.parse(text)
    } catch {
      aiError.value = 'La IA devolvió un formato inválido. Intenta reformular tu solicitud.'
      return
    }

    // Push a history snapshot before mutating so the user can Ctrl+Z the AI change.
    // store.history is the public Pinia state array (already unwrapped).
    if (store.currentPage) {
      store.history.push(structuredClone(toRaw(store.currentPage)))
      if (store.history.length > MAX_HISTORY) store.history.shift()
      store.future.splice(0)
    }

    store.setPage(page)

    // Send AI_PATCH to the runtime iframe for immediate live preview
    if (previewFrame.value?.contentWindow) {
      sendEditorMessage(
        previewFrame.value.contentWindow,
        { type: 'AI_PATCH', payload: page },
        RUNTIME_ORIGIN
      )
    }

    aiPrompt.value = ''
    streamedTokens.value = ''
  }

  return {
    isAiPanelOpen,
    aiPrompt,
    isLoading,
    aiError,
    streamedTokens,
    toggleAiPanel,
    submitPrompt,
    clearPrompt
  }
}
