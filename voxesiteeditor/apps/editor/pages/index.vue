<script setup lang="ts">
import { ref, watch, toRaw, onMounted } from 'vue'
import { BlockSchemas } from '@cms/ui/schemas'
import BlockEditorModal from '../modals/BlockEditorModal.vue'
import { usePageStore } from '../stores/usePageStore'

const store = usePageStore()
const previewFrame = ref<HTMLIFrameElement | null>(null)

// ─── Sync page changes to the runtime iframe ──────────────────────────────────
// Keeps the preview up to date whenever any part of page state changes
// (block added, prop edited, undo/redo, etc.) without requiring a save.
// This preserves the existing ADD_BLOCK postMessage protocol.
watch(
  () => store.page,
  (newPage) => {
    if (!newPage) return
    previewFrame.value?.contentWindow?.postMessage(
      { type: 'ADD_BLOCK', page: structuredClone(toRaw(newPage)) },
      'http://localhost:3001'
    )
  },
  { deep: true }
)

// ─── Persist page + notify runtime ────────────────────────────────────────────
async function savePage() {
  if (!store.page) return
  await $fetch('/api/save', {
    method: 'POST',
    body: toRaw(store.page)
  })

  previewFrame.value?.contentWindow?.postMessage(
    { type: 'PAGE_SAVED', page: structuredClone(toRaw(store.page)) },
    'http://localhost:3001'
  )

  alert('Página guardada 🚀')
}

async function publishSite(siteId: string) {
  if (!siteId) {
    alert('No hay siteId definido')
    return
  }
  await $fetch(`http://localhost:2999/api/${siteId}/build`, { method: 'POST' })
  alert(`Sitio publicado: ${siteId}`)
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
onMounted(async () => {
  // Load page from the backend into the store
  try {
    const result: any = await $fetch('/api/page')
    if (result?.data) {
      store.setPage(result.data)
    }
  } catch {
    // Page doesn't exist on the server yet — store keeps its null default
  }

  // Listen for block selection messages from the runtime iframe
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'BLOCK_SELECT') {
      store.selectBlock(event.data.blockId)
    }
  })
})
</script>

<template>
  <button
    v-for="[type, schema] in Object.entries(BlockSchemas)"
    :key="type"
    @click="store.addBlock(type)"
  >{{ schema.content.label }}</button>

  <button :disabled="!store.canUndo" @click="store.undo()">Deshacer</button>
  <button :disabled="!store.canRedo" @click="store.redo()">Rehacer</button>

  <iframe ref="previewFrame" src="http://localhost:3001" width="100%" height="400" />

  <button @click="savePage">Guardar página</button>
  <button @click="publishSite('demosite')">Publicar</button>

  <!-- Modal reads selectedBlock from the store directly — no props needed -->
  <BlockEditorModal />
</template>
