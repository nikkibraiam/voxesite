import type { Page, SiteLayout } from './page'

/**
 * All messages exchanged between the editor (parent window)
 * and the runtime iframe, and between the native layer and the editor WebView.
 *
 * Direction:
 *   Editor → Runtime : PAGE_UPDATE, LAYOUT_UPDATE, AI_PATCH, AI_VOICE_RESPONSE
 *   Runtime → Editor : BLOCK_SELECT, LAYOUT_BLOCK_SELECT
 *   Native → Editor  : VOICE_INPUT (audio chunks from native mic capture)
 *   Editor → Native  : AI_VOICE_RESPONSE (forwarded by runtime for TTS)
 */
export type EditorMessage =
  | { type: 'PAGE_UPDATE'; payload: Page }
  | { type: 'BLOCK_SELECT'; payload: { blockId: string | null } }
  | { type: 'AI_PATCH'; payload: Partial<Page> }
  | { type: 'LAYOUT_UPDATE'; payload: SiteLayout }
  | { type: 'LAYOUT_BLOCK_SELECT'; payload: { slot: 'header' | 'footer' | null } }
  // Voice input — sent from the native layer (Android/iOS) to the editor WebView.
  // The native layer captures microphone audio and sends base64-encoded chunks.
  | { type: 'VOICE_INPUT'; payload: { audio: string; mimeType: string } }
  // Transcript update — sent from the editor to consumers as transcription tokens arrive.
  | { type: 'VOICE_TRANSCRIPT'; payload: { text: string; isFinal: boolean } }
  // AI voice response — sent from the editor to the runtime iframe after AI completes.
  // TODO: Native Android/iOS layer should listen for this message and invoke system TTS
  | { type: 'AI_VOICE_RESPONSE'; payload: { text: string } }

/** Type guard — narrows unknown `event.data` to EditorMessage */
export function isEditorMessage(data: unknown): data is EditorMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    [
      'PAGE_UPDATE',
      'BLOCK_SELECT',
      'AI_PATCH',
      'LAYOUT_UPDATE',
      'LAYOUT_BLOCK_SELECT',
      'VOICE_INPUT',
      'VOICE_TRANSCRIPT',
      'AI_VOICE_RESPONSE'
    ].includes((data as { type: string }).type)
  )
}

/** Send a typed message to a target window */
export function sendEditorMessage(
  target: Window,
  message: EditorMessage,
  targetOrigin: string
): void {
  target.postMessage(message, targetOrigin)
}
