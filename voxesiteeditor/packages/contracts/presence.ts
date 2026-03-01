/**
 * Presence data shared via the Yjs awareness protocol.
 * Each connected editor session broadcasts one UserPresence entry.
 */
export interface UserPresence {
  /** Random UUID generated client-side per session (not persisted). */
  userId: string
  /** Display name shown in the presence bar and conflict toasts. */
  displayName: string
  /** Deterministic HSL colour derived from userId hash. */
  color: string
  /** Block currently selected in the page editor, or null. */
  selectedBlockId: string | null
  /** Layout slot currently selected ('header' | 'footer'), or null. */
  selectedLayoutBlockId: 'header' | 'footer' | null
  /** Optional iframe cursor position (for future rich-text support). */
  cursor?: { x: number; y: number }
  /** Epoch ms of the last time this user made a selection or edit. */
  lastSeen: number
}

/**
 * Produce a deterministic HSL colour string from a userId string.
 * Same userId always → same colour across all clients.
 */
export function presenceColorFromId(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 65%, 50%)`
}
