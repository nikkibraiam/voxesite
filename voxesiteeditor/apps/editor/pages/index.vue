<script setup lang="ts">
import { BlockSchemas } from '@cms/ui/schemas'
import BlockEditorModal from '../modals/BlockEditorModal.vue'
import { usePageStore } from '../stores/usePageStore'
import { usePageEditor } from '../composables/usePageEditor'
import { useDragDrop } from '../composables/useDragDrop'

const store = usePageStore()
const { savePage, publishSite } = usePageEditor()
useDragDrop()

function addNewPage() {
  store.addPage({
    id: crypto.randomUUID(),
    slug: `page-${Date.now()}`,
    title: 'Nueva página',
    blocks: []
  })
}
</script>

<template>
  <!-- Page tabs — lets the user switch between pages in the site -->
  <div class="page-tabs">
    <button
      v-for="p in store.site?.pages ?? []"
      :key="p.id"
      :class="{ active: p.id === store.currentPageId }"
      @click="store.setCurrentPage(p.id)"
    >
      {{ p.title ?? p.slug }}
    </button>
    <button @click="addNewPage">+ Página</button>
  </div>

  <!-- Block add buttons — disabled when no page is active -->
  <button
    v-for="[type, schema] in Object.entries(BlockSchemas)"
    :key="type"
    :disabled="!store.currentPage"
    @click="store.addBlock(type)"
  >{{ schema.content.label }}</button>

  <button :disabled="!store.canUndo" @click="store.undo()">Deshacer</button>
  <button :disabled="!store.canRedo" @click="store.redo()">Rehacer</button>

  <!--
    src is bound to the current page slug so switching tabs navigates the iframe.
    usePageEditor also watches currentPageId and updates src on tab switch.
  -->
  <iframe
    ref="previewFrame"
    :src="`http://localhost:3001/${store.currentPage?.slug ?? 'home'}`"
    width="100%"
    height="400"
  />

  <button @click="savePage">Guardar sitio</button>
  <button @click="publishSite('demosite')">Publicar</button>

  <!-- Modal reads selectedBlock from the store directly — no props needed -->
  <BlockEditorModal />
</template>
