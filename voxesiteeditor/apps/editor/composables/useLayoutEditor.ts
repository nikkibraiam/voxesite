import { ref, computed } from 'vue'
import { usePageStore } from '../stores/usePageStore'

/**
 * Manages "layout edit mode" in the editor — the Layout tab alongside page tabs.
 *
 * When isLayoutMode is true:
 *  - The block-selector panel shows layout slots (Header, Footer) instead of page blocks.
 *  - Clicking the header/footer in the iframe fires LAYOUT_BLOCK_SELECT, which
 *    calls store.selectLayoutBlock — this composable does not need to handle
 *    the message itself (usePageEditor does).
 *
 * Consumed only by apps/editor/pages/index.vue.
 */
export function useLayoutEditor() {
  const store = usePageStore()

  /** Whether the editor is currently showing the Layout panel (vs a page tab). */
  const isLayoutMode = ref(false)

  /** Whether the current site has a header defined. */
  const hasHeader = computed(() => !!store.site?.layout?.header)

  /** Whether the current site has a footer defined. */
  const hasFooter = computed(() => !!store.site?.layout?.footer)

  /** Activate layout edit mode and deselect any page block. */
  function activateLayoutMode() {
    isLayoutMode.value = true
    store.selectBlock(null)
  }

  /**
   * Switch to a page tab.
   * Deactivates layout mode and clears layout block selection.
   */
  function activatePage(pageId: string) {
    isLayoutMode.value = false
    store.selectLayoutBlock(null)
    store.setCurrentPage(pageId)
  }

  /**
   * Add (or select) the header. Creates from schema defaults when absent.
   * Stays in layout mode.
   */
  function addOrSelectHeader() {
    store.addHeader()
  }

  /**
   * Add (or select) the footer. Creates from schema defaults when absent.
   * Stays in layout mode.
   */
  function addOrSelectFooter() {
    store.addFooter()
  }

  return {
    isLayoutMode,
    hasHeader,
    hasFooter,
    activateLayoutMode,
    activatePage,
    addOrSelectHeader,
    addOrSelectFooter,
  }
}
