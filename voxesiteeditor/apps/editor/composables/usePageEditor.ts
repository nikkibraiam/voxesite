import { ref, watch, toRaw, onMounted, useTemplateRef } from 'vue'
import { usePageStore } from '../stores/usePageStore'
import { sendEditorMessage, isEditorMessage } from '@cms/contracts'
import type { SiteVersion } from '@cms/contracts'

const RUNTIME_ORIGIN = 'http://localhost:3001'
const SITE_ID = 'demosite'

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

  /** Published version snapshots fetched from the build server. */
  const versionHistory = ref<SiteVersion[]>([])

  // ─── Live preview sync (page) ────────────────────────────────────────────────
  // store.page is a computed alias for currentPage. Deep-watching it fires on
  // every block mutation (edit, undo, redo, add block) — same as before.
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

  // ─── Live preview sync (layout) ──────────────────────────────────────────────
  // Deep-watch site.layout so any header/footer change immediately reflects in
  // the runtime iframe without requiring a save.
  watch(
    () => store.site?.layout,
    (newLayout) => {
      if (!newLayout || !previewFrame.value?.contentWindow) return
      sendEditorMessage(
        previewFrame.value.contentWindow,
        { type: 'LAYOUT_UPDATE', payload: structuredClone(toRaw(newLayout)) },
        RUNTIME_ORIGIN
      )
    },
    { deep: true }
  )

  // ─── Page switch: update iframe src ─────────────────────────────────────────
  // When the user clicks a different page tab, currentPageId changes.
  // Changing src causes the runtime iframe to navigate to the new page's slug,
  // re-fetching its data from the build server and re-registering its listener.
  watch(
    () => store.currentPageId,
    () => {
      const slug = store.currentPage?.slug
      if (!slug || !previewFrame.value) return
      previewFrame.value.src = `${RUNTIME_ORIGIN}/${slug}`
    }
  )

  // ─── Save ───────────────────────────────────────────────────────────────────
  // Sends the entire Site JSON so the server can persist all pages atomically.
  async function savePage() {
    if (!store.site) return
    await $fetch('/api/save', {
      method: 'POST',
      body: toRaw(store.site)
    })
    // Re-push current page so the runtime regenerates styles after save
    if (previewFrame.value?.contentWindow && store.page) {
      sendEditorMessage(
        previewFrame.value.contentWindow,
        { type: 'PAGE_UPDATE', payload: structuredClone(toRaw(store.page)) },
        RUNTIME_ORIGIN
      )
    }
    alert('Sitio guardado')
  }

  // ─── Publish ────────────────────────────────────────────────────────────────
  // 1. Bumps semver patch in the store (e.g. "1.0.0" → "1.0.1")
  // 2. Sets publishedAt
  // 3. Saves the full site
  // 4. Triggers the Nuxt static build (which also snapshots the version)
  // 5. Reloads the version history list
  async function publishSite(siteId: string) {
    if (!store.site || !siteId) {
      alert('No hay siteId definido')
      return
    }
    store.site.version = bumpPatch(store.site.version)
    store.site.publishedAt = new Date().toISOString()

    await $fetch('/api/save', {
      method: 'POST',
      body: toRaw(store.site)
    })

    await $fetch(`http://localhost:2999/api/${siteId}/build`, { method: 'POST' })

    await loadVersionHistory(siteId)

    alert(`Sitio publicado: ${siteId} v${store.site.version}`)
  }

  // ─── Version history ────────────────────────────────────────────────────────
  async function loadVersionHistory(siteId: string) {
    try {
      const result = await $fetch<{ ok: boolean; versions: SiteVersion[] }>(
        `http://localhost:2999/api/${siteId}/versions`
      )
      if (result.ok) versionHistory.value = result.versions
    } catch {
      versionHistory.value = []
    }
  }

  // ─── Bootstrap ──────────────────────────────────────────────────────────────
  onMounted(async () => {
    // Load the full site from the backend into the store
    try {
      const result: any = await $fetch('/api/site')
      if (result?.data) {
        store.setSite(result.data)
      }
    } catch {
      // Site doesn't exist on the server yet — store keeps its null default
    }

    // Load version history in parallel with the site load
    loadVersionHistory(SITE_ID)

    // Listen for typed messages from the runtime iframe
    window.addEventListener('message', (event) => {
      if (!isEditorMessage(event.data)) return

      if (event.data.type === 'BLOCK_SELECT') {
        // A page block was clicked — clear any layout selection
        store.selectLayoutBlock(null)
        store.selectBlock(event.data.payload.blockId)
      }

      if (event.data.type === 'LAYOUT_BLOCK_SELECT') {
        // A layout block (header/footer) was clicked — clear page block selection
        store.selectBlock(null)
        store.selectLayoutBlock(event.data.payload.slot)
      }
    })
  })

  return { savePage, publishSite, versionHistory, loadVersionHistory }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Increment the patch segment of a semver string.
 * "1.2.3" → "1.2.4"   |   malformed input → "1.0.1"
 */
function bumpPatch(version: string): string {
  const parts = version.split('.')
  if (parts.length !== 3) return '1.0.1'
  const patch = parseInt(parts[2]!, 10)
  if (isNaN(patch)) return '1.0.1'
  return `${parts[0]}.${parts[1]}.${patch + 1}`
}
