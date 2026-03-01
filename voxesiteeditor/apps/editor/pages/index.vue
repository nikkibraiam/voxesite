<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import { BlockSchemas } from '@cms/ui/schemas'
import SelectableBlock from '@cms/ui/wrappers/SelectableBlock.vue'
import BlockEditorPanel from '../components/BlockEditorPanel.vue'
import AiPromptPanel from '../components/AiPromptPanel.vue'
import GeneratePageModal from '../components/GeneratePageModal.vue'
import { usePageStore } from '../stores/usePageStore'
import { usePageEditor } from '../composables/usePageEditor'
import { useLayoutEditor } from '../composables/useLayoutEditor'
import { useDragDrop } from '../composables/useDragDrop'
import { useAiEditor } from '../composables/useAiEditor'
import { usePageGenerator } from '../composables/usePageGenerator'

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
const { isAiPanelOpen, toggleAiPanel } = useAiEditor()
const { openModal: openGenerateModal } = usePageGenerator()

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
  <div class="editor-shell">
    <!-- ── Tab bar ──────────────────────────────────────────────────────────── -->
    <div class="page-tabs">
      <button
        :class="{ active: isLayoutMode }"
        @click="activateLayoutMode"
      >
        Layout
      </button>

      <button
        v-for="p in store.site?.pages ?? []"
        :key="p.id"
        :class="{ active: !isLayoutMode && p.id === store.currentPageId }"
        @click="activatePage(p.id)"
      >
        {{ p.title ?? p.slug }}
      </button>

      <button @click="addNewPage">+ Página</button>

      <!-- Generate page — 44×44 px touch target -->
      <button
        class="generate-btn"
        title="Generar página con IA (⚡)"
        @click="openGenerateModal()"
      >⚡</button>

      <!-- AI toggle — right-aligned -->
      <button
        class="ai-toggle-btn"
        :class="{ active: isAiPanelOpen }"
        title="Panel de IA (✨)"
        @click="toggleAiPanel"
      >✨ IA</button>
    </div>

    <!-- ── Main content row: sidebar + iframe ──────────────────────────────── -->
    <div class="editor-body">
      <!-- Left sidebar -->
      <aside class="editor-sidebar">
        <!-- Layout mode controls -->
        <template v-if="isLayoutMode">
          <div class="layout-controls">
            <h4>Bloques de Layout</h4>

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
                style="color: red;"
                @click="store.removeHeader()"
              >Eliminar Header</button>
            </div>

            <div class="layout-slot">
              <button @click="addOrSelectFooter">
                {{ hasFooter ? 'Editar Footer' : '+ Agregar Footer' }}
              </button>
              <button
                v-if="hasFooter"
                style="color: red;"
                @click="store.removeFooter()"
              >Eliminar Footer</button>
            </div>
          </div>
        </template>

        <!-- Page mode: add block buttons + undo/redo + draggable block list -->
        <template v-else>
          <div class="block-add-buttons">
            <button
              v-for="[type, schema] in Object.entries(BlockSchemas)"
              :key="type"
              :disabled="!store.currentPage"
              @click="store.addBlock(type)"
            >{{ schema.content.label }}</button>
          </div>

          <div class="history-buttons">
            <button :disabled="!store.canUndo" @click="store.undo()">Deshacer</button>
            <button :disabled="!store.canRedo" @click="store.redo()">Rehacer</button>
          </div>

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

        <!-- Site actions -->
        <div class="site-actions">
          <button @click="savePage">Guardar sitio</button>
          <button @click="publishSite('demosite')">Publicar</button>
        </div>
      </aside>

      <!-- iframe preview — fills remaining space -->
      <div class="preview-area">
        <!--
          src is bound to the current page slug so switching tabs navigates the iframe.
          usePageEditor also watches currentPageId and updates src on tab switch.
          The runtime always renders header + page blocks + footer.
        -->
        <iframe
          ref="previewFrame"
          :src="`http://localhost:3001/${store.currentPage?.slug ?? 'home'}`"
          class="preview-iframe"
        />
      </div>
    </div>
  </div>

  <!-- AI prompt panel — slides up from the bottom, shrinks the iframe -->
  <AiPromptPanel />

  <!-- Side panel — slides in from the right, sits over the iframe -->
  <BlockEditorPanel />

  <!-- Generate page modal — three tabs: URL / Screenshot / HTML -->
  <GeneratePageModal />
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
/* ── Shell layout ───────────────────────────────────────────────────────────── */
.editor-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* ── Tab bar ────────────────────────────────────────────────────────────────── */
.page-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px;
  border-bottom: 1px solid #ddd;
  flex-shrink: 0;
  background: #f8f8f8;
}

.page-tabs button {
  padding: 4px 12px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
}

.page-tabs button.active {
  background: #4a90d9;
  color: #fff;
  border-color: #4a90d9;
}

/* Generate page button — ⚡ icon, 44×44 px touch target */
.generate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 44px;
  padding: 0 10px;
  background: #2e2e50;
  color: #c8c8f8;
  border-color: #2e2e50;
  font-size: 16px;
}

.generate-btn:hover {
  background: #5858c8;
  color: #fff;
  border-color: #5858c8;
}

/* AI toggle — push to the right end of the tab bar */
.ai-toggle-btn {
  margin-left: auto;
  background: #1a1a2e;
  color: #9090d0;
  border-color: #2e2e50;
}

.ai-toggle-btn.active {
  background: #5858c8 !important;
  color: #fff !important;
  border-color: #5858c8 !important;
}

/* ── Body row: sidebar + preview ────────────────────────────────────────────── */
.editor-body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* ── Left sidebar ───────────────────────────────────────────────────────────── */
.editor-sidebar {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border-right: 1px solid #ddd;
  background: #fafafa;
  overflow-y: auto;
}

.block-add-buttons {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-buttons {
  display: flex;
  gap: 4px;
}

.site-actions {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 8px;
  border-top: 1px solid #eee;
}

/* ── Layout controls ────────────────────────────────────────────────────────── */
.layout-controls h4 {
  margin: 0 0 8px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #666;
}

.layout-slot {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

/* ── Block list ─────────────────────────────────────────────────────────────── */
.block-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.block-list__item {
  position: relative;
}

.block-list__label {
  display: block;
  padding: 8px 8px 8px 52px;
  font-size: 13px;
  font-weight: 500;
  background: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  user-select: none;
}

/* ── Preview area ───────────────────────────────────────────────────────────── */
.preview-area {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}
</style>
