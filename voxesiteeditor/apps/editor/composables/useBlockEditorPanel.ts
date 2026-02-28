import { ref, watch } from 'vue'
import { usePageStore } from '../stores/usePageStore'

/**
 * Manages the open/close state of the block editor side panel.
 *
 * Auto-opens when a block or layout slot is selected in the store,
 * and auto-closes when nothing is selected.
 */
export function useBlockEditorPanel() {
  const store = usePageStore()

  const isPanelOpen = ref(false)
  const panelMode = ref<'block' | 'layout' | null>(null)

  function openPanel(mode: 'block' | 'layout') {
    panelMode.value = mode
    isPanelOpen.value = true
  }

  function closePanel() {
    isPanelOpen.value = false
    panelMode.value = null
  }

  // Auto-open when something is selected; auto-close when nothing is.
  watch(
    () => [store.selectedBlockId, store.selectedLayoutBlockId] as const,
    ([blockId, layoutSlot]) => {
      if (layoutSlot) {
        openPanel('layout')
      } else if (blockId) {
        openPanel('block')
      } else {
        closePanel()
      }
    }
  )

  return { isPanelOpen, panelMode, openPanel, closePanel }
}
