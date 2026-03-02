<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { BlockSchemas } from '@cms/ui/schemas'
import { SelectableBlock } from '@cms/ui/wrappers'
import BlockEditorPanel from '../components/BlockEditorPanel.vue'
import AiPromptPanel from '../components/AiPromptPanel.vue'
import GeneratePageModal from '../components/GeneratePageModal.vue'
import PresenceBar from '../components/PresenceBar.vue'
import { usePageStore } from '../stores/usePageStore'
import { usePageEditor } from '../composables/usePageEditor'
import { useLayoutEditor } from '../composables/useLayoutEditor'
import { useDragDrop } from '../composables/useDragDrop'
import { useAiEditor } from '../composables/useAiEditor'
import { usePageGenerator } from '../composables/usePageGenerator'
import { useCollaboration } from '../composables/useCollaboration'
import { useBlockSelection } from '../composables/useBlockSelection'
import { useCompositeBlocks } from '../composables/useCompositeBlocks'

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

// ── Grid overlay toggle ───────────────────────────────────────────────────────
const showGridOverlay = ref(false)

// ── Collaboration — single call, shares the iframe ref with usePageEditor ────
const previewFrame = useTemplateRef<HTMLIFrameElement>('previewFrame')
const { isConnected, connectedUsers, localUser } = useCollaboration('demosite', previewFrame)

// Block selection with conflict-warning support
const { selectBlock: selectBlockWithWarning, conflictWarning } = useBlockSelection({ connectedUsers })

// ── Composite blocks — multi-select + group/ungroup ───────────────────────────
const {
  selectedIds: compositeSelectedIds,
  canGroup,
  toggleSelect,
  clearSelection: clearCompositeSelection,
  groupSelected,
  ungroup
} = useCompositeBlocks()

/** Whether the sidebar is in multi-select mode. */
const isMultiSelectMode = ref(false)

/** Pending name for the group-as-component dialog. */
const groupName = ref('')

/** Whether the name dialog is visible. */
const isGroupDialogOpen = ref(false)

/** Context menu state — blockId of the right-clicked composite block + position. */
const contextMenu = ref<{ blockId: string; x: number; y: number } | null>(null)

function toggleMultiSelectMode() {
  isMultiSelectMode.value = !isMultiSelectMode.value
  if (!isMultiSelectMode.value) {
    clearCompositeSelection()
  }
}

function onBlockClick(blockId: string) {
  if (isMultiSelectMode.value) {
    toggleSelect(blockId)
  } else {
    selectBlockWithWarning(blockId)
  }
}

function openGroupDialog() {
  if (!canGroup.value) return
  groupName.value = 'Componente sin nombre'
  isGroupDialogOpen.value = true
}

function confirmGroup() {
  const name = groupName.value.trim() || 'Componente sin nombre'
  groupSelected(name)
  isGroupDialogOpen.value = false
  groupName.value = ''
  isMultiSelectMode.value = false
}

function cancelGroup() {
  isGroupDialogOpen.value = false
  groupName.value = ''
}

function onBlockContextMenu(blockId: string, event: MouseEvent) {
  const block = store.currentPage?.blocks.find(b => b.id === blockId)
  if (block?.type !== 'Composite') return
  event.preventDefault()
  contextMenu.value = { blockId, x: event.clientX, y: event.clientY }
}

function onUngroupFromMenu() {
  if (!contextMenu.value) return
  ungroup(contextMenu.value.blockId)
  contextMenu.value = null
}

function closeContextMenu() {
  contextMenu.value = null
}

// Close context menu on outside click / escape
function onGlobalKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (contextMenu.value) {
      contextMenu.value = null
      return
    }
    if (isGroupDialogOpen.value) {
      cancelGroup()
      return
    }
    if (isMultiSelectMode.value) {
      isMultiSelectMode.value = false
      clearCompositeSelection()
    }
  }

  // Delete key — remove the currently selected block when not editing text
  if (e.key === 'Delete' && store.selectedBlockId && !isMultiSelectMode.value) {
    const tag = (e.target as HTMLElement).tagName.toLowerCase()
    if (tag !== 'input' && tag !== 'textarea') {
      e.preventDefault()
      store.removeBlock(store.selectedBlockId)
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
  window.addEventListener('click', closeContextMenu)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  window.removeEventListener('click', closeContextMenu)
})

function addNewPage() {
  store.addPage({
    id: crypto.randomUUID(),
    slug: `page-${Date.now()}`,
    title: 'Nueva página',
    blocks: []
  })
}

// ── Page settings dialog ─────────────────────────────────────────────────────
const isPageSettingsOpen = ref(false)
const pageSettingsDraft = ref({
  id: '',
  title: '',
  slug: '',
  seoTitle: '',
  seoDescription: ''
})

function openPageSettings(e: MouseEvent, page: { id: string; title?: string; slug: string; seo?: { title: string; description?: string } }) {
  e.stopPropagation()
  pageSettingsDraft.value = {
    id: page.id,
    title: page.title ?? '',
    slug: page.slug,
    seoTitle: page.seo?.title ?? '',
    seoDescription: page.seo?.description ?? ''
  }
  isPageSettingsOpen.value = true
}

function savePageSettings() {
  const d = pageSettingsDraft.value
  store.updatePageMeta(d.id, {
    title: d.title || undefined,
    slug: d.slug.trim() || d.id,
    seo: (d.seoTitle || d.seoDescription)
      ? { title: d.seoTitle, description: d.seoDescription || undefined }
      : undefined
  })
  isPageSettingsOpen.value = false
}

function deleteCurrentPageFromSettings() {
  const id = pageSettingsDraft.value.id
  isPageSettingsOpen.value = false
  store.removePage(id)
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

      <span
        v-for="p in store.site?.pages ?? []"
        :key="p.id"
        class="page-tab"
        :class="{ active: !isLayoutMode && p.id === store.currentPageId }"
        @click="activatePage(p.id)"
      >
        {{ p.title ?? p.slug }}
        <button
          class="page-tab__settings"
          title="Configurar página"
          @click="openPageSettings($event, p)"
        >⚙</button>
      </span>

      <button @click="addNewPage">+ Página</button>

      <!-- Generate page — 44×44 px touch target -->
      <button
        class="generate-btn"
        title="Generar página con IA (⚡)"
        @click="openGenerateModal()"
      >⚡</button>

      <!-- Presence bar — connected users (right-aligned, before AI toggle) -->
      <PresenceBar
        class="presence-bar-tab"
        :users="connectedUsers"
        :local-user="localUser"
        :is-connected="isConnected"
      />

      <!-- AI toggle — right-aligned -->
      <button
        class="ai-toggle-btn"
        :class="{ active: isAiPanelOpen }"
        title="Panel de IA (✨)"
        @click="toggleAiPanel"
      >✨ IA</button>

      <!-- Grid overlay toggle -->
      <button
        class="grid-toggle-btn"
        :class="{ active: showGridOverlay }"
        title="Mostrar/ocultar guías de columnas"
        @click="showGridOverlay = !showGridOverlay"
      ># Grid</button>
    </div>

    <!-- Conflict warning toast — non-blocking informational message -->
    <Transition name="conflict-toast">
      <div v-if="conflictWarning" class="conflict-toast" role="status" aria-live="polite">
        ⚠️ {{ conflictWarning }}
      </div>
    </Transition>

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
              v-for="[type, schema] in Object.entries(BlockSchemas).filter(([t]) => t !== 'Composite')"
              :key="type"
              :disabled="!store.currentPage"
              @click="store.addBlock(type)"
            >{{ schema.content.label }}</button>
          </div>

          <div class="history-buttons">
            <button :disabled="!store.canUndo" @click="store.undo()">Deshacer</button>
            <button :disabled="!store.canRedo" @click="store.redo()">Rehacer</button>
          </div>

          <!-- Multi-select toolbar -->
          <div class="multiselect-toolbar">
            <button
              :class="{ active: isMultiSelectMode }"
              class="multiselect-toggle"
              title="Seleccionar múltiples bloques"
              @click="toggleMultiSelectMode"
            >
              {{ isMultiSelectMode ? '✕ Cancelar selección' : '⊞ Seleccionar múltiples' }}
            </button>

            <button
              v-if="isMultiSelectMode && canGroup"
              class="group-btn"
              @click="openGroupDialog"
            >
              Agrupar como componente
            </button>
          </div>

          <!-- Draggable block list — drag handle in each SelectableBlock allows reordering. -->
          <VueDraggable
            v-model="draggableBlocks"
            v-bind="sortableOptions"
            class="block-list"
          >
            <div
              v-for="block in draggableBlocks"
              :key="block.id"
              class="block-list__item"
              :class="{
                'block-list__item--selected': isMultiSelectMode && compositeSelectedIds.includes(block.id),
                'block-list__item--composite': block.type === 'Composite'
              }"
              @contextmenu="onBlockContextMenu(block.id, $event)"
            >
              <SelectableBlock
                :blockId="block.id"
                :enabled="true"
                @select="onBlockClick"
              >
                <span class="block-list__label">
                  <span v-if="block.type === 'Composite'" class="composite-badge" title="Componente personalizado">⊞</span>
                  {{ block.type === 'Composite'
                    ? (store.site?.customComponents?.find(c => c.id === block.props.definitionId)?.name ?? 'Componente')
                    : block.type
                  }}
                </span>
                <span
                  v-if="isMultiSelectMode"
                  class="select-checkbox"
                  :class="{ checked: compositeSelectedIds.includes(block.id) }"
                  aria-hidden="true"
                />
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
        <iframe
          ref="previewFrame"
          :src="`http://localhost:3001/${store.currentPage?.slug ?? 'home'}?editor=1`"
          class="preview-iframe"
        />
        <!-- 12-column guide overlay — pointer-events:none so iframe still receives events -->
        <div v-if="showGridOverlay" class="grid-overlay" aria-hidden="true" />
      </div>
    </div>
  </div>

  <!-- AI prompt panel — slides up from the bottom, shrinks the iframe -->
  <AiPromptPanel />

  <!-- Side panel — slides in from the right, sits over the iframe -->
  <BlockEditorPanel />

  <!-- Generate page modal — three tabs: URL / Screenshot / HTML -->
  <GeneratePageModal />

  <!-- ── Group name dialog ─────────────────────────────────────────────────── -->
  <Transition name="dialog-fade">
    <div v-if="isGroupDialogOpen" class="dialog-overlay" @click.self="cancelGroup">
      <div class="dialog-box" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <h3 id="dialog-title" class="dialog-title">Nombrar componente</h3>
        <input
          v-model="groupName"
          class="dialog-input"
          type="text"
          placeholder="Nombre del componente"
          autofocus
          @keydown.enter="confirmGroup"
          @keydown.esc="cancelGroup"
        />
        <div class="dialog-actions">
          <button class="dialog-btn dialog-btn--cancel" @click="cancelGroup">Cancelar</button>
          <button class="dialog-btn dialog-btn--confirm" @click="confirmGroup">Crear componente</button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- ── Page settings dialog ─────────────────────────────────────────────── -->
  <Transition name="dialog-fade">
    <div v-if="isPageSettingsOpen" class="dialog-overlay" @click.self="isPageSettingsOpen = false">
      <div class="dialog-box page-settings-box" role="dialog" aria-modal="true" aria-labelledby="pset-title">
        <h3 id="pset-title" class="dialog-title">Configurar página</h3>

        <label class="pset-label">
          Nombre (pestaña)
          <input v-model="pageSettingsDraft.title" class="dialog-input" type="text" placeholder="Mi página" />
        </label>

        <label class="pset-label">
          Slug (URL)
          <input v-model="pageSettingsDraft.slug" class="dialog-input" type="text" placeholder="mi-pagina" />
        </label>

        <label class="pset-label">
          SEO — Título
          <input v-model="pageSettingsDraft.seoTitle" class="dialog-input" type="text" placeholder="Título para buscadores" />
        </label>

        <label class="pset-label">
          SEO — Descripción
          <textarea v-model="pageSettingsDraft.seoDescription" class="dialog-input pset-textarea" placeholder="Descripción breve…" />
        </label>

        <div class="dialog-actions pset-actions">
          <button
            class="dialog-btn pset-delete-btn"
            :disabled="(store.site?.pages.length ?? 0) <= 1"
            :title="(store.site?.pages.length ?? 0) <= 1 ? 'No se puede eliminar la única página' : 'Eliminar página'"
            @click="deleteCurrentPageFromSettings"
          >Eliminar página</button>
          <div class="pset-actions-right">
            <button class="dialog-btn dialog-btn--cancel" @click="isPageSettingsOpen = false">Cancelar</button>
            <button class="dialog-btn dialog-btn--confirm" @click="savePageSettings">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- ── Context menu (composite blocks) ──────────────────────────────────── -->
  <Transition name="ctx-fade">
    <ul
      v-if="contextMenu"
      class="ctx-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      @click.stop
    >
      <li class="ctx-menu__item" @click="onUngroupFromMenu">Desagrupar</li>
    </ul>
  </Transition>
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

/* Page tab — wraps label + ⚙ gear button */
.page-tab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px 4px 12px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  user-select: none;
}

.page-tab.active {
  background: #4a90d9;
  color: #fff;
  border-color: #4a90d9;
}

.page-tab__settings {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 3px;
  font-size: 13px;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
  flex-shrink: 0;
}

.page-tab__settings:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.12);
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

/* Presence bar — no border, transparent background so it sits inline */
.presence-bar-tab {
  margin-left: auto;
  background: transparent;
  border: none;
  padding: 0;
}

/* AI toggle — comes after the presence bar */
.ai-toggle-btn {
  background: #1a1a2e;
  color: #9090d0;
  border-color: #2e2e50;
}

.ai-toggle-btn.active {
  background: #5858c8 !important;
  color: #fff !important;
  border-color: #5858c8 !important;
}

/* Conflict warning toast */
.conflict-toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  white-space: nowrap;
  z-index: 9999;
  pointer-events: none;
}

.conflict-toast-enter-active,
.conflict-toast-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.conflict-toast-enter-from,
.conflict-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
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

/* ── Multi-select toolbar ───────────────────────────────────────────────────── */
.multiselect-toolbar {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.multiselect-toggle {
  font-size: 12px;
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background: #fff;
  cursor: pointer;
  text-align: left;
}

.multiselect-toggle.active {
  background: #e8f0fe;
  border-color: #4a90d9;
  color: #2a60b0;
}

.group-btn {
  font-size: 12px;
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid #5858c8;
  background: #5858c8;
  color: #fff;
  cursor: pointer;
}

.group-btn:hover {
  background: #4040b0;
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

.block-list__item--selected :deep(.block-label-wrap) {
  background: #e8f0fe;
  border-color: #4a90d9;
}

.block-list__item--composite .block-list__label {
  background: #f0eaff;
  border-color: #9b59b6;
}

.block-list__label {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 8px 8px 52px;
  font-size: 13px;
  font-weight: 500;
  background: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  user-select: none;
}

.composite-badge {
  font-size: 14px;
  color: #7c3aed;
  flex-shrink: 0;
}

/* Checkbox visual indicator in multi-select mode */
.select-checkbox {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  border: 2px solid #aaa;
  border-radius: 3px;
  background: #fff;
  pointer-events: none;
}

.select-checkbox.checked {
  background: #4a90d9;
  border-color: #4a90d9;
}

.select-checkbox.checked::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 0px;
  width: 5px;
  height: 9px;
  border: 2px solid #fff;
  border-top: none;
  border-left: none;
  transform: rotate(45deg);
}

/* ── Preview area ───────────────────────────────────────────────────────────── */
.preview-area {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  position: relative; /* needed for the absolute grid overlay */
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

/* 12-column guide overlay — non-interactive, purely visual */
.grid-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
  background-image: linear-gradient(to right, rgba(74, 144, 217, 0.18) 1px, transparent 1px);
  background-size: calc(100% / 12) 100%;
}

/* Grid toggle button */
.grid-toggle-btn {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
  color: #666;
}

.grid-toggle-btn.active {
  background: #e8f0fe;
  border-color: #4a90d9;
  color: #2a60b0;
}

/* ── Group name dialog ──────────────────────────────────────────────────────── */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.dialog-box {
  background: #1e1e1e;
  color: #ebebeb;
  border-radius: 8px;
  padding: 24px;
  width: 320px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dialog-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.dialog-input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border-radius: 4px;
  border: 1px solid #444;
  background: #111;
  color: #e8e8e8;
  font-size: 14px;
  outline: none;
}

.dialog-input:focus {
  border-color: #5858c8;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.dialog-btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid transparent;
  min-height: 44px;
}

.dialog-btn--cancel {
  background: transparent;
  border-color: #555;
  color: #aaa;
}

.dialog-btn--cancel:hover {
  background: #2a2a2a;
}

.dialog-btn--confirm {
  background: #5858c8;
  color: #fff;
}

.dialog-btn--confirm:hover {
  background: #4040b0;
}

.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.15s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

/* ── Context menu ───────────────────────────────────────────────────────────── */
.ctx-menu {
  position: fixed;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  list-style: none;
  margin: 0;
  padding: 4px 0;
  min-width: 140px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  z-index: 300;
}

.ctx-menu__item {
  padding: 8px 16px;
  font-size: 13px;
  color: #e8e8e8;
  cursor: pointer;
}

.ctx-menu__item:hover {
  background: #3d3d3d;
}

.ctx-fade-enter-active,
.ctx-fade-leave-active {
  transition: opacity 0.1s ease;
}

.ctx-fade-enter-from,
.ctx-fade-leave-to {
  opacity: 0;
}

/* ── Page settings dialog extras ────────────────────────────────────────────── */
.page-settings-box {
  width: 360px;
  gap: 12px;
}

.pset-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #aaa;
}

.pset-textarea {
  resize: vertical;
  min-height: 64px;
  font-family: inherit;
  font-size: 14px;
}

.pset-actions {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.pset-actions-right {
  display: flex;
  gap: 8px;
}

.pset-delete-btn {
  background: transparent;
  border-color: #c0392b;
  color: #e74c3c;
}

.pset-delete-btn:hover:not(:disabled) {
  background: #c0392b;
  color: #fff;
}

.pset-delete-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
</style>
