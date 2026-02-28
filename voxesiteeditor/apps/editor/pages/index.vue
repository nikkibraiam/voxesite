<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import { BlockSchemas } from '@cms/ui/schemas'
import SelectableBlock from '@cms/ui/wrappers/SelectableBlock.vue'
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
const { draggableBlocks, sortableOptions } = useDragDrop()

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

  <!-- Page mode: block add buttons + undo/redo + draggable block list -->
  <template v-else>
    <button
      v-for="[type, schema] in Object.entries(BlockSchemas)"
      :key="type"
      :disabled="!store.currentPage"
      @click="store.addBlock(type)"
    >{{ schema.content.label }}</button>

    <button :disabled="!store.canUndo" @click="store.undo()">Deshacer</button>
    <button :disabled="!store.canRedo" @click="store.redo()">Rehacer</button>

    <!-- Draggable block list — drag handle in each SelectableBlock allows reordering.
         usePageEditor deep-watches store.site and fires PAGE_UPDATE to the iframe
         automatically after every reorder, so no manual postMessage is needed here. -->
    <VueDraggable
      v-model="draggableBlocks"
      v-bind="sortableOptions"
      class="block-list"
    >
      <div
        v-for="block in draggableBlocks"
        :key="block.id"
        class="block-list__item"
      >
        <SelectableBlock
          :blockId="block.id"
          :enabled="true"
          @select="store.selectBlock"
        >
          <span class="block-list__label">{{ block.type }}</span>
        </SelectableBlock>
      </div>
    </VueDraggable>
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

<style>
/* ── Global drag styles (unscoped — SortableJS adds these classes to the DOM) ── */

.drag-ghost {
  opacity: 0.4;
  background: #c8ebfb;
  border: 2px dashed #4a90d9;
}

.drag-chosen {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
</style>

<style scoped>
.block-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}

.block-list__item {
  /* Ensure position:relative context is maintained for the absolute drag handle */
  position: relative;
}

.block-list__label {
  display: block;
  padding: 8px 8px 8px 52px; /* 52px left clears the drag handle */
  font-size: 13px;
  font-weight: 500;
  background: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  user-select: none;
}
</style>
