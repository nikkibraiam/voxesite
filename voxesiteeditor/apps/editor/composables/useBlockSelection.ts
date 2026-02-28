import { computed } from 'vue'
import { usePageStore } from '../stores/usePageStore'

/**
 * Thin wrapper around store selection state.
 * Centralises any future selection-specific logic (multi-select, focus trapping,
 * keyboard nav) without touching the store or components.
 */
export function useBlockSelection() {
  const store = usePageStore()

  return {
    selectedBlockId: computed(() => store.selectedBlockId),
    selectedBlock: computed(() => store.selectedBlock),
    selectBlock: (id: string | null) => store.selectBlock(id),
  }
}
