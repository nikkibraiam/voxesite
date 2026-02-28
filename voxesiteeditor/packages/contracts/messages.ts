import type { Page } from './page'

/**
 * All messages exchanged between the editor (parent window)
 * and the runtime iframe.
 *
 * Direction:
 *   Editor → Runtime : PAGE_UPDATE, AI_PATCH
 *   Runtime → Editor : BLOCK_SELECT
 */
export type EditorMessage =
  | { type: 'PAGE_UPDATE'; payload: Page }
  | { type: 'BLOCK_SELECT'; payload: { blockId: string | null } }
  | { type: 'AI_PATCH'; payload: Partial<Page> }

/** Type guard — narrows unknown `event.data` to EditorMessage */
export function isEditorMessage(data: unknown): data is EditorMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    ['PAGE_UPDATE', 'BLOCK_SELECT', 'AI_PATCH'].includes(
      (data as { type: string }).type
    )
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
