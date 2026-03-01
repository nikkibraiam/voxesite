import { ref, computed } from 'vue'
import { usePageStore } from '../stores/usePageStore'

export function useCompositeBlocks() {
  const store = usePageStore()

  /** Block IDs currently selected in multi-select mode. */
  const selectedIds = ref<string[]>([])

  /** True when 2+ blocks are selected and grouping is possible. */
  const canGroup = computed(() => selectedIds.value.length >= 2)

  /** Toggle a block's presence in the multi-select set. */
  function toggleSelect(blockId: string) {
    const idx = selectedIds.value.indexOf(blockId)
    if (idx >= 0) {
      selectedIds.value.splice(idx, 1)
    } else {
      selectedIds.value.push(blockId)
    }
  }

  /** Remove all IDs from the multi-select set. */
  function clearSelection() {
    selectedIds.value = []
  }

  /**
   * Group the currently selected blocks into a named CompositeBlock.
   * Clears the selection on success.
   */
  function groupSelected(name: string) {
    if (!canGroup.value) return
    store.createCompositeBlock(selectedIds.value, name)
    selectedIds.value = []
  }

  /**
   * Ungroup a Composite block — replaces it with its definition's children
   * at the same page position.
   */
  function ungroup(blockId: string) {
    const block = store.currentPage?.blocks.find(b => b.id === blockId)
    if (!block || block.type !== 'Composite') return
    const def = store.site?.customComponents?.find(c => c.id === block.props.definitionId)
    if (!def) return
    store.replaceBlockWithChildren(blockId, def.children)
  }

  return {
    selectedIds,
    canGroup,
    toggleSelect,
    clearSelection,
    groupSelected,
    ungroup
  }
}
