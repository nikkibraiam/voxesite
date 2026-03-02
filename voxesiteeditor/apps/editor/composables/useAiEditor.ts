import { ref, shallowRef, watchEffect, toRaw, useTemplateRef } from 'vue'
import { usePageStore } from '../stores/usePageStore'
import { sendEditorMessage } from '@cms/contracts'
import type { Page } from '@cms/contracts'

const RUNTIME_ORIGIN = 'http://localhost:3001'
const MAX_HISTORY = 50

// ── Singleton state — shared across ALL callers of useAiEditor() ─────────────
// This is required because index.vue holds the toggle button while
// AiPromptPanel.vue holds the v-if and the form. Both call this composable,
// so they MUST share the same reactive refs.
const isAiPanelOpen = ref(false)
const aiPrompt = ref('')
const isLoading = ref(false)
const aiError = ref<string | null>(null)
/** Accumulates streamed tokens during a streaming LLM response. */
const streamedTokens = ref('')

/**
 * Shared preview frame ref — populated by whichever component has
 * `<iframe ref="previewFrame">` in its template (index.vue).
 * AiPromptPanel.vue has no such element so its localFrame is null; the
 * module-level ref retains the frame set by index.vue.
 */
const _previewFrame = shallowRef<HTMLIFrameElement | null>(null)

/**
 * Manages the AI Prompt Space panel.
 *
 * Requires `<iframe ref="previewFrame" />` in the consuming component's template
 * so it can send AI_PATCH messages to the runtime for live preview.
 */
export function useAiEditor() {
  const store = usePageStore()

  // Register the preview frame from the calling component's template (if present).
  // index.vue has <iframe ref="previewFrame">; AiPromptPanel.vue does not.
  // watchEffect runs inside the component's effect scope, so it is safe to call here.
  const localFrame = useTemplateRef<HTMLIFrameElement>('previewFrame')
  watchEffect(() => {
    if (localFrame.value) _previewFrame.value = localFrame.value
  })

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
            _applyAiResult(store, data.text ?? streamedTokens.value)
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

// ─── Internal helper (module-level so it uses the shared _previewFrame) ───────

function _applyAiResult(store: ReturnType<typeof usePageStore>, text: string) {
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

  if (_previewFrame.value?.contentWindow) {
    // Send AI_PATCH to the runtime iframe for immediate live preview
    sendEditorMessage(
      _previewFrame.value.contentWindow,
      { type: 'AI_PATCH', payload: page },
      RUNTIME_ORIGIN
    )

    // Send AI_VOICE_RESPONSE so the runtime can forward it to the native layer for TTS.
    // The web layer does NOT play audio — native Android/iOS handles speech synthesis.
    // TODO: Native Android/iOS layer should listen for this message and invoke system TTS
    //       (Android → TextToSpeech API, iOS → AVSpeechSynthesizer)
    sendEditorMessage(
      _previewFrame.value.contentWindow,
      { type: 'AI_VOICE_RESPONSE', payload: { text } },
      RUNTIME_ORIGIN
    )
  }

  aiPrompt.value = ''
  streamedTokens.value = ''
}
