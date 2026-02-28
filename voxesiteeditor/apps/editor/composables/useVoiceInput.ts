import { ref, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import { isEditorMessage } from '@cms/contracts'

/**
 * Manages voice input transcription via WebSocket.
 *
 * Architecture:
 *   [Native Layer] → postMessage VOICE_INPUT (base64 audio chunk)
 *       → [useVoiceInput receives it]
 *       → [WebSocket to node-build-server /transcription]
 *       → [Whisper transcription on server]
 *       → [WebSocket streams TRANSCRIPT_TOKEN messages back]
 *       → [liveTranscript ref updates in real-time]
 *       → [On TRANSCRIPT_DONE: aiPrompt.value is set and ready for submission]
 *
 * The mic button in AiPromptPanel can also call startListening() / stopListening()
 * for browser-based testing (e.g. sending pre-recorded audio via postMessage).
 *
 * @param options.aiPrompt  The aiPrompt ref from useAiEditor — populated on TRANSCRIPT_DONE.
 */
export function useVoiceInput(options: { aiPrompt: Ref<string> }) {
  const { aiPrompt } = options

  const isListening = ref(false)
  const liveTranscript = ref('')

  let ws: WebSocket | null = null

  // WS URL from Nuxt runtime config — set NUXT_PUBLIC_WS_URL in .env
  const config = useRuntimeConfig()
  const WS_URL =
    (config.public.wsUrl as string | undefined) ?? 'ws://localhost:2999/transcription'

  // ─── WebSocket lifecycle ────────────────────────────────────────────────────

  function _openWebSocket(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(WS_URL)

      socket.onopen = () => resolve(socket)

      socket.onerror = () =>
        reject(new Error(`[useVoiceInput] Cannot connect to WebSocket at ${WS_URL}`))

      socket.onmessage = _onWsMessage

      socket.onclose = () => {
        if (isListening.value) {
          isListening.value = false
        }
      }

      ws = socket
    })
  }

  function _closeWebSocket() {
    if (ws) {
      ws.onmessage = null
      ws.onclose = null
      ws.close()
      ws = null
    }
  }

  // ─── WebSocket message handler ─────────────────────────────────────────────

  function _onWsMessage(event: MessageEvent) {
    let msg: { type: string; payload?: any }
    try {
      msg = JSON.parse(event.data)
    } catch {
      return
    }

    if (msg.type === 'TRANSCRIPT_TOKEN') {
      liveTranscript.value += msg.payload?.token ?? ''
    }

    if (msg.type === 'TRANSCRIPT_DONE') {
      const fullText = (msg.payload?.fullText ?? liveTranscript.value).trim()
      // Populate the AI prompt textarea so the user can review before submitting
      aiPrompt.value = fullText
      liveTranscript.value = ''
      isListening.value = false
    }

    if (msg.type === 'TRANSCRIPT_ERROR') {
      console.error('[useVoiceInput] Transcription error:', msg.payload?.message)
      liveTranscript.value = ''
      isListening.value = false
    }
  }

  // ─── Audio chunk forwarding ────────────────────────────────────────────────

  function _sendAudioChunk(audio: string, mimeType: string) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'VOICE_CHUNK', payload: { audio, mimeType } }))
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Open the WebSocket connection and mark as listening.
   * Call this when the mic button is pressed, or before sending the first audio chunk.
   */
  async function startListening() {
    if (isListening.value) return
    liveTranscript.value = ''
    isListening.value = true

    try {
      await _openWebSocket()
    } catch (err) {
      console.error(err)
      isListening.value = false
    }
  }

  /**
   * Signal the server that the audio stream is complete (VOICE_END).
   * The server will begin transcription and stream tokens back.
   */
  function stopListening() {
    if (!isListening.value || !ws) return
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'VOICE_END' }))
    }
    // isListening stays true until TRANSCRIPT_DONE/ERROR arrives
  }

  // ─── Native layer message listener ────────────────────────────────────────
  //
  // The native Android/iOS app sends VOICE_INPUT postMessages containing
  // base64-encoded audio chunks. We forward them over WebSocket to the server.

  async function _onNativeMessage(event: MessageEvent) {
    if (!isEditorMessage(event.data)) return
    if (event.data.type !== 'VOICE_INPUT') return

    const { audio, mimeType } = event.data.payload

    // Auto-open the WebSocket on the first chunk if not already listening
    if (!isListening.value) {
      await startListening()
    }
    _sendAudioChunk(audio, mimeType)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('message', _onNativeMessage)
  }

  // ─── Cleanup ───────────────────────────────────────────────────────────────

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', _onNativeMessage)
    }
    _closeWebSocket()
  })

  return { isListening, liveTranscript, startListening, stopListening }
}
