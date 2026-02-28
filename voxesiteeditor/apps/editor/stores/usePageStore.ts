import { defineStore } from 'pinia'
import { ref, computed, toRaw } from 'vue'
import type { Page, Site, BaseBlock } from '@cms/contracts'
import { BlockSchemas } from '@cms/ui/schemas'

const MAX_HISTORY = 50

export const usePageStore = defineStore('page', () => {
  // ─── Primary state ──────────────────────────────────────────────────────────

  /** The full site document — root of all mutable state. */
  const site = ref<Site | null>(null)

  /** ID of the page currently open in the editor canvas. */
  const currentPageId = ref<string | null>(null)

  /** Currently selected block (opens BlockEditorModal). */
  const selectedBlockId = ref<string | null>(null)

  /**
   * Undo stack — stores Page snapshots for the *current* page only.
   * Cleared when the user switches to a different page via setCurrentPage().
   */
  const history = ref<Page[]>([])

  /**
   * Redo stack — populated when the user undoes.
   * Cleared on any new block mutation.
   */
  const future = ref<Page[]>([])

  // ─── Computed getters ───────────────────────────────────────────────────────

  /** The page currently open in the editor canvas. */
  const currentPage = computed<Page | null>(() => {
    if (!site.value || !currentPageId.value) return null
    return site.value.pages.find(p => p.id === currentPageId.value) ?? null
  })

  /**
   * Backward-compat alias for `currentPage`.
   * All existing consumers (`BlockEditorModal`, `usePageEditor` watcher, etc.)
   * read `store.page` — this keeps them working with zero changes.
   */
  const page = computed<Page | null>(() => currentPage.value)

  const selectedBlock = computed<BaseBlock<string, any> | null>(() => {
    if (!currentPage.value || !selectedBlockId.value) return null
    return currentPage.value.blocks.find(b => b.id === selectedBlockId.value) ?? null
  })

  const canUndo = computed(() => history.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)

  // ─── Internal helpers ───────────────────────────────────────────────────────

  /** Snapshot the current page before a mutation (for undo). */
  function _snapshot() {
    if (!currentPage.value) return
    history.value.push(structuredClone(toRaw(currentPage.value)))
    if (history.value.length > MAX_HISTORY) history.value.shift()
    future.value = []
  }

  /**
   * Replace the matching page in site.pages by id.
   * All block mutations funnel through this to keep site.value reactive.
   */
  function _replacePage(updated: Page) {
    if (!site.value) return
    const idx = site.value.pages.findIndex(p => p.id === updated.id)
    if (idx !== -1) site.value.pages[idx] = updated
  }

  // ─── Site-level actions ─────────────────────────────────────────────────────

  /**
   * Load the full site (e.g. on initial mount from the API).
   * Does NOT create a history snapshot — loading is not an undoable action.
   * Defaults currentPageId to the first page if not yet set.
   */
  function setSite(newSite: Site) {
    site.value = newSite
    history.value = []
    future.value = []
    selectedBlockId.value = null
    if (newSite.pages.length > 0) {
      currentPageId.value = newSite.pages[0]!.id
    }
  }

  /**
   * Switch the active page in the editor.
   * Clears history/future because undo is scoped per-page session.
   * Deselects any currently selected block.
   */
  function setCurrentPage(id: string) {
    if (!site.value) return
    if (!site.value.pages.some(p => p.id === id)) return // guard: invalid id
    currentPageId.value = id
    history.value = []
    future.value = []
    selectedBlockId.value = null
  }

  /**
   * Add a new page to the site and immediately switch to it.
   * Page additions are not block-level undoable actions.
   */
  function addPage(newPage: Page) {
    if (!site.value) return
    site.value.pages.push(newPage)
    setCurrentPage(newPage.id)
  }

  /**
   * Remove a page by id.
   * Guards: will not remove the last page.
   * Switches to the previous sibling (or first page) when removing the current page.
   */
  function removePage(id: string) {
    if (!site.value || site.value.pages.length <= 1) return
    const idx = site.value.pages.findIndex(p => p.id === id)
    if (idx === -1) return
    site.value.pages.splice(idx, 1)
    if (currentPageId.value === id) {
      // pages still has items (length > 1 guard above), so the index is always valid
      setCurrentPage(site.value.pages[Math.max(0, idx - 1)]!.id)
    }
  }

  // ─── Backward-compat page action ────────────────────────────────────────────

  /**
   * Replace the current page's data. Kept for backward compatibility.
   * If no site is loaded yet, bootstraps a minimal site wrapper.
   * Does NOT create a history snapshot.
   */
  function setPage(newPage: Page) {
    if (!site.value) {
      site.value = { id: 'demosite', version: '1.0.0', pages: [newPage], layout: {} }
      currentPageId.value = newPage.id
    } else {
      const exists = site.value.pages.some(p => p.id === newPage.id)
      if (exists) {
        _replacePage(newPage)
      } else {
        site.value.pages.push(newPage)
      }
      currentPageId.value = newPage.id
    }
  }

  // ─── Block-level actions (operate on currentPage) ──────────────────────────

  /**
   * Add a new block of the given type to the end of the current page.
   * Uses the schema's defaultProps to pre-fill content.
   */
  function addBlock(type: string) {
    if (!currentPage.value || !site.value) return
    _snapshot()
    const schema = BlockSchemas[type]
    const updated: Page = structuredClone(toRaw(currentPage.value))
    updated.blocks.push({
      id: crypto.randomUUID(),
      type,
      props: { ...schema.content.defaultProps }
    })
    _replacePage(updated)
  }

  /**
   * Replace a block by its id within the current page.
   *
   * @param options.snapshot - Whether to push a history entry before mutating.
   *   Pass `false` for live/real-time updates (e.g. every color-picker drag)
   *   to avoid flooding the history stack. Pass `true` (the default) for
   *   intentional user actions like clicking "Apply".
   */
  function updateBlock(
    updated: BaseBlock<string, any>,
    options: { snapshot?: boolean } = {}
  ) {
    if (!currentPage.value || !site.value) return
    const { snapshot = true } = options
    if (snapshot) _snapshot()
    const updatedPage: Page = structuredClone(toRaw(currentPage.value))
    const idx = updatedPage.blocks.findIndex(b => b.id === updated.id)
    if (idx !== -1) updatedPage.blocks[idx] = updated
    _replacePage(updatedPage)
  }

  /**
   * Remove a block by id from the current page.
   * Deselects the block if it was selected.
   */
  function removeBlock(id: string) {
    if (!currentPage.value || !site.value) return
    _snapshot()
    const updatedPage: Page = structuredClone(toRaw(currentPage.value))
    updatedPage.blocks = updatedPage.blocks.filter(b => b.id !== id)
    if (selectedBlockId.value === id) selectedBlockId.value = null
    _replacePage(updatedPage)
  }

  /**
   * Set the currently selected block (opens the editor panel).
   * Pass `null` to deselect.
   */
  function selectBlock(id: string | null) {
    selectedBlockId.value = id
  }

  // ─── Undo / Redo ───────────────────────────────────────────────────────────

  /** Restore the previous page state from the undo stack. */
  function undo() {
    if (!canUndo.value || !currentPage.value) return
    future.value.push(structuredClone(toRaw(currentPage.value)))
    _replacePage(history.value.pop()!)
  }

  /** Re-apply a previously undone state from the redo stack. */
  function redo() {
    if (!canRedo.value || !currentPage.value) return
    history.value.push(structuredClone(toRaw(currentPage.value)))
    _replacePage(future.value.pop()!)
  }

  // ─── Exports ────────────────────────────────────────────────────────────────

  return {
    // state
    site,
    currentPageId,
    selectedBlockId,
    history,
    future,
    // getters
    currentPage,
    page,           // backward-compat alias for currentPage
    selectedBlock,
    canUndo,
    canRedo,
    // site actions
    setSite,
    setCurrentPage,
    addPage,
    removePage,
    // backward-compat page action
    setPage,
    // block actions
    addBlock,
    updateBlock,
    removeBlock,
    selectBlock,
    // history
    undo,
    redo,
  }
})
