<script setup lang="ts">
import { BlockSchemas } from '@cms/ui/schemas'
import BlockEditorModal from '../modals/BlockEditorModal.vue'
import { usePageStore } from '../stores/usePageStore'
import { usePageEditor } from '../composables/usePageEditor'
import { useLayoutEditor } from '../composables/useLayoutEditor'
import { useDragDrop } from '../composables/useDragDrop'

const store = usePageStore()
const { savePage, publishSite } = usePageEditor()
const {
  isLayoutMode,
  hasHeader,
  hasFooter,
  activateLayoutMode,
  activatePage,
  addOrSelectHeader,
  addOrSelectFooter
} = useLayoutEditor()
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
  <!-- Tab bar: Layout tab + page tabs + add page -->
  <div class="page-tabs">
    <!-- Layout tab -->
    <button
      :class="{ active: isLayoutMode }"
      @click="activateLayoutMode"
    >
      Layout
    </button>

    <!-- Page tabs -->
    <button
      v-for="p in store.site?.pages ?? []"
      :key="p.id"
      :class="{ active: !isLayoutMode && p.id === store.currentPageId }"
      @click="activatePage(p.id)"
    >
      {{ p.title ?? p.slug }}
    </button>

    <button @click="addNewPage">+ Página</button>
  </div>

  <!-- Layout mode: show layout block controls -->
  <template v-if="isLayoutMode">
    <div class="layout-controls">
      <h4>Bloques de Layout</h4>

      <!-- Header slot -->
      <div class="layout-slot">
        <button @click="addOrSelectHeader">
          {{ hasHeader ? 'Editar Header' : '+ Agregar Header' }}
        </button>
        <button
          v-if="hasHeader"
          :disabled="!store.canUndoLayout"
          @click="store.undoLayout()"
        >Deshacer layout</button>
        <button
          v-if="hasHeader"
          :disabled="!store.canRedoLayout"
          @click="store.redoLayout()"
        >Rehacer layout</button>
        <button
          v-if="hasHeader"
          @click="store.removeHeader()"
          style="color: red;"
        >Eliminar Header</button>
      </div>

      <!-- Footer slot -->
      <div class="layout-slot">
        <button @click="addOrSelectFooter">
          {{ hasFooter ? 'Editar Footer' : '+ Agregar Footer' }}
        </button>
        <button
          v-if="hasFooter"
          @click="store.removeFooter()"
          style="color: red;"
        >Eliminar Footer</button>
      </div>
    </div>
  </template>

  <!-- Page mode: block add buttons + undo/redo -->
  <template v-else>
    <button
      v-for="[type, schema] in Object.entries(BlockSchemas)"
      :key="type"
      :disabled="!store.currentPage"
      @click="store.addBlock(type)"
    >{{ schema.content.label }}</button>

    <button :disabled="!store.canUndo" @click="store.undo()">Deshacer</button>
    <button :disabled="!store.canRedo" @click="store.redo()">Rehacer</button>
  </template>

  <!--
    src is bound to the current page slug so switching tabs navigates the iframe.
    usePageEditor also watches currentPageId and updates src on tab switch.
    The runtime always renders header + page blocks + footer.
  -->
  <iframe
    ref="previewFrame"
    :src="`http://localhost:3001/${store.currentPage?.slug ?? 'home'}`"
    width="100%"
    height="400"
  />

  <button @click="savePage">Guardar sitio</button>
  <button @click="publishSite('demosite')">Publicar</button>

  <!-- Modal reads selectedBlock / selectedLayoutBlock from the store directly -->
  <BlockEditorModal />
</template>
