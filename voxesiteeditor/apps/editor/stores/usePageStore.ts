import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Page, BaseBlock } from '@cms/contracts'
import { BlockSchemas } from '@cms/ui/schemas'

const MAX_HISTORY = 50

export const usePageStore = defineStore('page', () => {
  // ─── State ─────────────────────────────────────────────────────────────────

  const page = ref<Page | null>(null)
  const selectedBlockId = ref<string | null>(null)

  /**
   * Undo stack: each entry is a full Page snapshot taken before a mutation.
   * Oldest entries are evicted when the cap is reached.
   */
  const history = ref<Page[]>([])

  /**
   * Redo stack: populated when the user undoes an action.
   * Any new mutation clears this stack.
   */
  const future = ref<Page[]>([])

  // ─── Getters ───────────────────────────────────────────────────────────────

  const selectedBlock = computed<BaseBlock<string, any> | null>(() => {
    if (!page.value || !selectedBlockId.value) return null
    return page.value.blocks.find(b => b.id === selectedBlockId.value) ?? null
  })

  const canUndo = computed(() => history.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)

  // ─── Internal helpers ──────────────────────────────────────────────────────

  /**
   * Push the current page onto the undo stack before a mutation.
   * Clears the redo stack so redo is only valid for the linear history.
   */
  function _snapshot() {
    if (!page.value) return
    history.value.push(structuredClone(page.value))
    if (history.value.length > MAX_HISTORY) {
      history.value.shift()
    }
    future.value = []
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  /**
   * Replace the entire page (e.g. on initial load from the API).
   * Does NOT create a history snapshot — loading is not an undoable action.
   */
  function setPage(newPage: Page) {
    page.value = newPage
  }

  /**
   * Add a new block of the given type to the end of the block list.
   * Uses the schema's defaultProps to pre-fill content.
   */
  function addBlock(type: string) {
    if (!page.value) return
    _snapshot()
    const schema = BlockSchemas[type]
    page.value.blocks.push({
      id: crypto.randomUUID(),
      type,
      props: { ...schema.content.defaultProps }
    })
  }

  /**
   * Replace a block by its id.
   *
   * @param updated  - The full updated block object.
   * @param options.snapshot - Whether to push a history entry before mutating.
   *   Pass `false` for live/real-time updates (e.g. every color-picker input
   *   event) to avoid flooding the history stack. Pass `true` (the default)
   *   for intentional user actions like clicking "Apply".
   */
  function updateBlock(
    updated: BaseBlock<string, any>,
    options: { snapshot?: boolean } = {}
  ) {
    if (!page.value) return
    const { snapshot = true } = options
    if (snapshot) _snapshot()
    const index = page.value.blocks.findIndex(b => b.id === updated.id)
    if (index !== -1) {
      page.value.blocks[index] = updated
    }
  }

  /**
   * Remove a block by id. Deselects the block if it was selected.
   */
  function removeBlock(id: string) {
    if (!page.value) return
    _snapshot()
    page.value.blocks = page.value.blocks.filter(b => b.id !== id)
    if (selectedBlockId.value === id) {
      selectedBlockId.value = null
    }
  }

  /**
   * Set the currently selected block (opens the editor panel).
   * Pass `null` to deselect.
   */
  function selectBlock(id: string | null) {
    selectedBlockId.value = id
  }

  /**
   * Restore the previous page state from the undo stack.
   */
  function undo() {
    if (!canUndo.value || !page.value) return
    future.value.push(structuredClone(page.value))
    page.value = history.value.pop()!
  }

  /**
   * Re-apply a previously undone state from the redo stack.
   */
  function redo() {
    if (!canRedo.value || !page.value) return
    history.value.push(structuredClone(page.value))
    page.value = future.value.pop()!
  }

  // ─── Exports ───────────────────────────────────────────────────────────────

  return {
    // state
    page,
    selectedBlockId,
    history,
    future,
    // getters
    selectedBlock,
    canUndo,
    canRedo,
    // actions
    setPage,
    addBlock,
    updateBlock,
    removeBlock,
    selectBlock,
    undo,
    redo,
  }
})
