import { defineStore } from 'pinia'
import { ref, computed, toRaw } from 'vue'
import type { Page, Site, BaseBlock, SiteLayout, LayoutBlock } from '@cms/contracts'
import { BlockSchemas, LayoutSchemas } from '@cms/ui/schemas'

const MAX_HISTORY = 50

export const usePageStore = defineStore('page', () => {
  // ─── Primary state ──────────────────────────────────────────────────────────

  /** The full site document — root of all mutable state. */
  const site = ref<Site | null>(null)

  /** ID of the page currently open in the editor canvas. */
  const currentPageId = ref<string | null>(null)

  /** Currently selected page block (opens BlockEditorModal for page blocks). */
  const selectedBlockId = ref<string | null>(null)

  /**
   * Currently selected layout slot ('header' | 'footer').
   * Mutually exclusive with selectedBlockId — setting one clears the other.
   */
  const selectedLayoutBlockId = ref<'header' | 'footer' | null>(null)

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

  /**
   * Undo stack for layout changes (header / footer).
   * Independent from the page history stack.
   */
  const layoutHistory = ref<SiteLayout[]>([])

  /**
   * Redo stack for layout changes.
   * Cleared on any new layout mutation.
   */
  const layoutFuture = ref<SiteLayout[]>([])

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

  /** The header or footer layout block currently selected for editing. */
  const selectedLayoutBlock = computed<LayoutBlock | null>(() => {
    if (!site.value || !selectedLayoutBlockId.value) return null
    if (selectedLayoutBlockId.value === 'header') return site.value.layout.header ?? null
    if (selectedLayoutBlockId.value === 'footer') return site.value.layout.footer ?? null
    return null
  })

  const canUndo = computed(() => history.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)
  const canUndoLayout = computed(() => layoutHistory.value.length > 0)
  const canRedoLayout = computed(() => layoutFuture.value.length > 0)

  // ─── Internal helpers ───────────────────────────────────────────────────────

  /** Snapshot the current page before a mutation (for undo). */
  function _snapshot() {
    if (!currentPage.value) return
    history.value.push(structuredClone(toRaw(currentPage.value)))
    if (history.value.length > MAX_HISTORY) history.value.shift()
    future.value = []
  }

  /** Snapshot the current layout before a mutation (for layout undo). */
  function _snapshotLayout() {
    if (!site.value) return
    layoutHistory.value.push(structuredClone(toRaw(site.value.layout)))
    if (layoutHistory.value.length > MAX_HISTORY) layoutHistory.value.shift()
    layoutFuture.value = []
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
    layoutHistory.value = []
    layoutFuture.value = []
    selectedBlockId.value = null
    selectedLayoutBlockId.value = null
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
    selectedLayoutBlockId.value = null
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
   * Move a block from one index to another within the current page.
   * Snapshots before mutating so Ctrl+Z works after a drag.
   * Deselects any selected block (nothing should stay selected mid-drag).
   */
  function reorderBlocks(fromIndex: number, toIndex: number) {
    if (!currentPage.value || !site.value) return
    if (fromIndex === toIndex) return
    _snapshot()
    const updatedPage: Page = structuredClone(toRaw(currentPage.value))
    const [moved] = updatedPage.blocks.splice(fromIndex, 1)
    updatedPage.blocks.splice(toIndex, 0, moved!)
    selectedBlockId.value = null
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
   * Set the currently selected page block (opens the editor panel).
   * Clears any layout block selection. Pass `null` to deselect.
   */
  function selectBlock(id: string | null) {
    selectedBlockId.value = id
    if (id !== null) selectedLayoutBlockId.value = null
  }

  /**
   * Set the currently selected layout slot ('header' | 'footer').
   * Clears any page block selection. Pass `null` to deselect.
   */
  function selectLayoutBlock(slot: 'header' | 'footer' | null) {
    selectedLayoutBlockId.value = slot
    if (slot !== null) selectedBlockId.value = null
  }

  // ─── Layout actions ─────────────────────────────────────────────────────────

  /**
   * Replace the entire site layout.
   * Used for bulk layout updates (e.g. rollback).
   */
  function updateLayout(
    layout: SiteLayout,
    options: { snapshot?: boolean } = {}
  ) {
    if (!site.value) return
    const { snapshot = true } = options
    if (snapshot) _snapshotLayout()
    site.value.layout = structuredClone(layout)
  }

  /**
   * Replace only the header layout block.
   * Equivalent to setting site.layout.header.
   */
  function updateHeader(
    header: LayoutBlock,
    options: { snapshot?: boolean } = {}
  ) {
    if (!site.value) return
    const { snapshot = true } = options
    if (snapshot) _snapshotLayout()
    site.value.layout = { ...site.value.layout, header: structuredClone(toRaw(header)) }
  }

  /**
   * Replace only the footer layout block.
   * Equivalent to setting site.layout.footer.
   */
  function updateFooter(
    footer: LayoutBlock,
    options: { snapshot?: boolean } = {}
  ) {
    if (!site.value) return
    const { snapshot = true } = options
    if (snapshot) _snapshotLayout()
    site.value.layout = { ...site.value.layout, footer: structuredClone(toRaw(footer)) }
  }

  /**
   * Create a new header block from schema defaults and select it.
   * No-op when a header already exists.
   */
  function addHeader() {
    if (!site.value) return
    if (site.value.layout.header) {
      // Header already exists — just select it
      selectLayoutBlock('header')
      return
    }
    const schema = LayoutSchemas['LayoutHeader']
    const block: LayoutBlock = {
      id: crypto.randomUUID(),
      type: 'LayoutHeader',
      props: structuredClone(schema.content.defaultProps)
    }
    updateHeader(block, { snapshot: true })
    selectLayoutBlock('header')
  }

  /**
   * Create a new footer block from schema defaults and select it.
   * No-op when a footer already exists.
   */
  function addFooter() {
    if (!site.value) return
    if (site.value.layout.footer) {
      // Footer already exists — just select it
      selectLayoutBlock('footer')
      return
    }
    const schema = LayoutSchemas['LayoutFooter']
    const block: LayoutBlock = {
      id: crypto.randomUUID(),
      type: 'LayoutFooter',
      props: structuredClone(schema.content.defaultProps)
    }
    updateFooter(block, { snapshot: true })
    selectLayoutBlock('footer')
  }

  /**
   * Remove the header layout block from the site.
   */
  function removeHeader() {
    if (!site.value?.layout.header) return
    _snapshotLayout()
    const { header: _h, ...rest } = site.value.layout
    site.value.layout = rest
    if (selectedLayoutBlockId.value === 'header') selectedLayoutBlockId.value = null
  }

  /**
   * Remove the footer layout block from the site.
   */
  function removeFooter() {
    if (!site.value?.layout.footer) return
    _snapshotLayout()
    const { footer: _f, ...rest } = site.value.layout
    site.value.layout = rest
    if (selectedLayoutBlockId.value === 'footer') selectedLayoutBlockId.value = null
  }

  // ─── Undo / Redo (page) ─────────────────────────────────────────────────────

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

  // ─── Undo / Redo (layout) ───────────────────────────────────────────────────

  /** Restore the previous layout state from the layout undo stack. */
  function undoLayout() {
    if (!canUndoLayout.value || !site.value) return
    layoutFuture.value.push(structuredClone(toRaw(site.value.layout)))
    site.value.layout = layoutHistory.value.pop()!
  }

  /** Re-apply a previously undone layout state from the layout redo stack. */
  function redoLayout() {
    if (!canRedoLayout.value || !site.value) return
    layoutHistory.value.push(structuredClone(toRaw(site.value.layout)))
    site.value.layout = layoutFuture.value.pop()!
  }

  // ─── Exports ────────────────────────────────────────────────────────────────

  return {
    // state
    site,
    currentPageId,
    selectedBlockId,
    selectedLayoutBlockId,
    history,
    future,
    layoutHistory,
    layoutFuture,
    // getters
    currentPage,
    page,           // backward-compat alias for currentPage
    selectedBlock,
    selectedLayoutBlock,
    canUndo,
    canRedo,
    canUndoLayout,
    canRedoLayout,
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
    reorderBlocks,
    selectBlock,
    // layout block selection
    selectLayoutBlock,
    // layout actions
    updateLayout,
    updateHeader,
    updateFooter,
    addHeader,
    addFooter,
    removeHeader,
    removeFooter,
    // history (page)
    undo,
    redo,
    // history (layout)
    undoLayout,
    redoLayout,
  }
})
