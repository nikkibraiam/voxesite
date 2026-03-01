import { computed, ref } from 'vue'
import { usePageStore } from '../stores/usePageStore'
import type { UserPresence } from '@cms/contracts'

/**
 * Thin wrapper around store selection state.
 * Centralises any future selection-specific logic (multi-select, focus trapping,
 * keyboard nav) without touching the store or components.
 *
 * Accepts an optional `connectedUsers` ref from `useCollaboration` to detect
 * when another user is actively editing the block being selected and show a
 * non-blocking informational warning.
 */
export function useBlockSelection(options?: {
  connectedUsers?: { value: UserPresence[] }
}) {
  const store = usePageStore()

  /**
   * Transient warning shown when another peer has the target block selected.
   * Cleared automatically after 3 s. Never blocks the selection — CRDTs handle
   * the actual conflict resolution.
   */
  const conflictWarning = ref<string | null>(null)
  let _clearTimer: ReturnType<typeof setTimeout> | null = null

  function selectBlock(id: string | null) {
    // Check whether a peer is actively editing this block
    if (id && options?.connectedUsers?.value?.length) {
      const now = Date.now()
      const peer = options.connectedUsers.value.find(
        u => u.selectedBlockId === id && now - u.lastSeen < 5000
      )
      if (peer) {
        conflictWarning.value = `${peer.displayName} está editando este bloque`
        if (_clearTimer) clearTimeout(_clearTimer)
        _clearTimer = setTimeout(() => { conflictWarning.value = null }, 3000)
      }
    }

    store.selectBlock(id)
  }

  return {
    selectedBlockId: computed(() => store.selectedBlockId),
    selectedBlock: computed(() => store.selectedBlock),
    selectBlock,
    conflictWarning
  }
}
