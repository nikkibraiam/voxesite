import { useTemplateRef, watch, toRaw, onMounted } from 'vue'
import { usePageStore } from '../stores/usePageStore'
import { sendEditorMessage, isEditorMessage } from '@cms/contracts'

const RUNTIME_ORIGIN = 'http://localhost:3001'

/**
 * Owns the iframe ref, live-preview sync, page load, save, and publish.
 * Moves all HTTP side effects and postMessage wiring out of index.vue.
 *
 * Requires `<iframe ref="previewFrame" />` in the consuming component's template.
 */
export function usePageEditor() {
  const store = usePageStore()

  // Links to the named template ref in the component — no need to return this.
  // useTemplateRef is Vue 3.5+ and resolves on the current component instance.
  const previewFrame = useTemplateRef<HTMLIFrameElement>('previewFrame')

  // ─── Live preview sync ──────────────────────────────────────────────────────
  // Every store mutation (edit, undo, redo, add block, …) pushes a PAGE_UPDATE
  // to the runtime iframe so the preview stays current without a save.
  watch(
    () => store.page,
    (newPage) => {
      if (!newPage || !previewFrame.value?.contentWindow) return
      sendEditorMessage(
        previewFrame.value.contentWindow,
        { type: 'PAGE_UPDATE', payload: structuredClone(toRaw(newPage)) },
        RUNTIME_ORIGIN
      )
    },
    { deep: true }
  )

  // ─── Persist page ───────────────────────────────────────────────────────────
  async function savePage() {
    if (!store.page) return
    await $fetch('/api/save', {
      method: 'POST',
      body: toRaw(store.page)
    })
    // Push after save so the runtime re-generates styles from the persisted data
    if (previewFrame.value?.contentWindow) {
      sendEditorMessage(
        previewFrame.value.contentWindow,
        { type: 'PAGE_UPDATE', payload: structuredClone(toRaw(store.page)) },
        RUNTIME_ORIGIN
      )
    }
    alert('Página guardada 🚀')
  }

  // ─── Publish site ───────────────────────────────────────────────────────────
  async function publishSite(siteId: string) {
    if (!siteId) {
      alert('No hay siteId definido')
      return
    }
    await $fetch(`http://localhost:2999/api/${siteId}/build`, { method: 'POST' })
    alert(`Sitio publicado: ${siteId}`)
  }

  // ─── Bootstrap ──────────────────────────────────────────────────────────────
  onMounted(async () => {
    // Load the page from the backend into the store
    try {
      const result: any = await $fetch('/api/page')
      if (result?.data) store.setPage(result.data)
    } catch {
      // Page doesn't exist on the server yet — store keeps its null default
    }

    // Listen for typed messages from the runtime iframe
    window.addEventListener('message', (event) => {
      if (!isEditorMessage(event.data)) return
      if (event.data.type === 'BLOCK_SELECT') {
        store.selectBlock(event.data.payload.blockId)
      }
    })
  })

  return { savePage, publishSite }
}
