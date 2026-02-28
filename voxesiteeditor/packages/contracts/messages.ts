import type { Page, SiteLayout } from './page'

/**
 * All messages exchanged between the editor (parent window)
 * and the runtime iframe.
 *
 * Direction:
 *   Editor → Runtime : PAGE_UPDATE, LAYOUT_UPDATE, AI_PATCH
 *   Runtime → Editor : BLOCK_SELECT, LAYOUT_BLOCK_SELECT
 */
export type EditorMessage =
  | { type: 'PAGE_UPDATE'; payload: Page }
  | { type: 'BLOCK_SELECT'; payload: { blockId: string | null } }
  | { type: 'AI_PATCH'; payload: Partial<Page> }
  | { type: 'LAYOUT_UPDATE'; payload: SiteLayout }
  | { type: 'LAYOUT_BLOCK_SELECT'; payload: { slot: 'header' | 'footer' | null } }

/** Type guard — narrows unknown `event.data` to EditorMessage */
export function isEditorMessage(data: unknown): data is EditorMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    ['PAGE_UPDATE', 'BLOCK_SELECT', 'AI_PATCH', 'LAYOUT_UPDATE', 'LAYOUT_BLOCK_SELECT'].includes(
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
