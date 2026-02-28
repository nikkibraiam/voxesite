import { computed } from 'vue'
import { usePageStore } from '../stores/usePageStore'
import type { BaseBlock } from '@cms/contracts'

export function useDragDrop() {
  const store = usePageStore()

  /**
   * Computed model for VueDraggable.
   *
   * GET  → current page blocks (drives the rendered list).
   * SET  → called by vue-draggable-plus after a drag ends with the reordered
   *        array. At this point the Pinia store has NOT been mutated yet
   *        (SortableJS only moved DOM nodes), so we can compare new vs old
   *        id order to derive fromIndex / toIndex and commit atomically.
   */
  const draggableBlocks = computed<BaseBlock<string, any>[]>({
    get: () => store.currentPage?.blocks ?? [],
    set: (newBlocks: BaseBlock<string, any>[]) => {
      const oldBlocks = store.currentPage?.blocks ?? []
      const oldIds = oldBlocks.map(b => b.id)
      const newIds = newBlocks.map(b => b.id)

      // Find the first position where the two id sequences differ.
      // Because SortableJS moves exactly one item per drag, the item at
      // newIds[i] is the one that was dragged (its old position is fromIndex).
      let fromIndex = -1
      let toIndex = -1
      for (let i = 0; i < newIds.length; i++) {
        if (newIds[i] !== oldIds[i]) {
          fromIndex = oldIds.indexOf(newIds[i]!)
          toIndex = i
          break
        }
      }

      if (fromIndex !== -1 && toIndex !== -1) {
        store.reorderBlocks(fromIndex, toIndex)
      }
    }
  })

  const sortableOptions = {
    animation: 200,
    handle: '.drag-handle',
    delay: 150,             // small pause before drag starts
    delayOnTouchOnly: true, // only apply delay on touch (not mouse)
    forceFallback: false,   // use SortableJS native touch handling
    ghostClass: 'drag-ghost',
    chosenClass: 'drag-chosen',
  }

  return { draggableBlocks, sortableOptions }
}
