<script setup lang="ts">
import { ref, watch, computed, toRaw, onMounted, onUnmounted, nextTick } from 'vue'
import { Pane } from 'tweakpane'
import { BlockSchemas, LayoutSchemas } from '@cms/ui/schemas'
import type { BaseBlock, CompositeBlockDefinition } from '@cms/contracts'
import { usePageStore } from '../stores/usePageStore'
import { useBlockEditorPanel } from '../composables/useBlockEditorPanel'
import ArrayField from './ArrayField.vue'

const store = usePageStore()
const { isPanelOpen } = useBlockEditorPanel()

const paneContainer = ref<HTMLDivElement | null>(null)
const draft = ref<BaseBlock<string, any> | null>(null)
const draftContext = ref<'page' | 'layout'>('page')

// ── Composite block state ─────────────────────────────────────────────────────

/** The resolved definition when draft is a Composite block. */
const compositeDef = computed<CompositeBlockDefinition | null>(() => {
  if (!draft.value || draft.value.type !== 'Composite') return null
  return store.site?.customComponents?.find(c => c.id === draft.value!.props.definitionId) ?? null
})

/** ID of the child block currently being edited (within a composite). */
const selectedChildId = ref<string | null>(null)

/** The merged child block (definition props + instance overrides) for the selected child. */
const selectedChild = computed<BaseBlock<string, any> | null>(() => {
  if (!compositeDef.value || !selectedChildId.value || !draft.value) return null
  const child = compositeDef.value.children.find(c => c.id === selectedChildId.value)
  if (!child) return null
  const override = draft.value.props.overrides?.[child.id]
  return override
    ? { ...child, props: { ...child.props, ...override.props } }
    : child
})

/** Schema for the selected child's block type. */
const childSchema = computed(() => {
  if (!selectedChild.value) return null
  return BlockSchemas[selectedChild.value.type] ?? null
})

/**
 * JSON field textarea values, keyed by field.key.
 * Kept in sync with draft.props[key] on every input event.
 */
const jsonFieldValues = ref<Record<string, string>>({})

/** Active Tweakpane instance — disposed and rebuilt on block selection change. */
let pane: Pane | null = null

// ─── Schema ─────────────────────────────────────────────────────────────────

const schema = computed(() => {
  if (!draft.value) return null
  if (draft.value.type === 'Composite') return null  // composite has its own panel
  return LayoutSchemas[draft.value.type] ?? BlockSchemas[draft.value.type] ?? null
})

/** Schema content fields that need plain textareas (not handled by Tweakpane). */
const textareaFields = computed(() => {
  if (!schema.value) return []
  return (schema.value.content.fields as any[]).filter(
    (f: any) => f.type === 'json' || f.type === 'css'
  )
})

/** Style group fields of type 'align' — rendered as 4-button toggles outside Tweakpane. */
const alignFields = computed(() => {
  if (!schema.value?.styles?.length) return []
  const result: Array<{ group: string; field: any }> = []
  for (const group of schema.value.styles as any[]) {
    for (const field of group.fields as any[]) {
      if (field.type === 'align') result.push({ group: group.group, field })
    }
  }
  return result
})

/** Schema content fields rendered by ArrayField (type: 'array'). */
const arrayFields = computed(() => {
  if (!schema.value) return []
  return (schema.value.content.fields as any[]).filter((f: any) => f.type === 'array')
})

/** Textarea fields for the selected child block in composite mode. */
const childTextareaFields = computed(() => {
  if (!childSchema.value) return []
  return (childSchema.value.content.fields as any[]).filter(
    (f: any) => f.type === 'json' || f.type === 'css'
  )
})

// ─── Selection watch — rebuild draft + Tweakpane pane ───────────────────────

watch(
  () => [store.selectedBlockId, store.selectedLayoutBlockId] as const,
  ([blockId, layoutSlot]) => {
    selectedChildId.value = null
    if (layoutSlot) {
      draftContext.value = 'layout'
      const lb = store.selectedLayoutBlock
      draft.value = lb ? structuredClone(toRaw(lb)) : null
    } else if (blockId) {
      draftContext.value = 'page'
      const block = store.selectedBlock
      draft.value = block ? structuredClone(toRaw(block)) : null
    } else {
      draft.value = null
    }
    nextTick(() => rebuildPane())
  },
  { immediate: true }
)

// When the selected child changes, rebuild the child pane
watch(selectedChildId, () => {
  nextTick(() => rebuildChildPane())
})

// ─── Tweakpane lifecycle (regular blocks) ────────────────────────────────────

function rebuildPane() {
  if (pane) {
    pane.dispose()
    pane = null
  }

  if (!draft.value || !schema.value || !paneContainer.value) return

  // Populate JSON textarea values from current draft
  jsonFieldValues.value = {}
  for (const field of schema.value.content.fields as any[]) {
    if (field.type === 'json') {
      const v = draft.value.props[field.key]
      jsonFieldValues.value[field.key] =
        v == null ? '' : typeof v === 'string' ? v : JSON.stringify(v, null, 2)
    }
  }

  pane = new Pane({ container: paneContainer.value })

  // ── Content fields ──────────────────────────────────────────────────────
  const contentFolder = pane.addFolder({ title: 'Contenido', expanded: true })

  for (const field of schema.value.content.fields as any[]) {
    if (field.type === 'json' || field.type === 'css' || field.type === 'array') continue

    if (field.type === 'color') {
      // Use a proxy so Tweakpane displays a neutral default without writing
      // '#000000' into draft.props before the user explicitly sets a color.
      const colorProxy: Record<string, string> = {
        [field.key]: (draft.value.props[field.key] as string) || '#ffffff'
      }
      const binding = contentFolder.addBinding(colorProxy, field.key, { label: field.label, view: 'color' })
      binding.on('change', ({ value }: { value: string }) => {
        draft.value!.props[field.key] = value
        _dispatchLive()
      })
    } else {
      if (draft.value.props[field.key] === undefined || draft.value.props[field.key] === null) {
        draft.value.props[field.key] = field.type === 'boolean' ? false : ''
      }
      const binding = contentFolder.addBinding(draft.value.props, field.key, { label: field.label })
      binding.on('change', () => _dispatchLive())
    }
  }

  // ── Style groups ────────────────────────────────────────────────────────
  if (schema.value.styles?.length) {
    for (const group of schema.value.styles as any[]) {
      const styleFolder = pane.addFolder({ title: group.group, expanded: false })

      if (!draft.value.styles) draft.value.styles = {}

      for (const field of group.fields as any[]) {
        // 'align' fields are rendered as button groups in the template, not via Tweakpane
        if (field.type === 'align') continue

        const selector: string = field.selector ?? ''
        const cssProp: string = field.cssProperty

        if (!draft.value.styles![selector]) draft.value.styles![selector] = {}
        const selectorStyles = draft.value.styles![selector] as Record<string, any>

        if (field.type === 'color') {
          // Proxy keeps '#000000' out of the stored styles until user changes it
          const colorProxy: Record<string, string> = {
            [cssProp]: (selectorStyles[cssProp] as string) || '#ffffff'
          }
          const binding = styleFolder.addBinding(colorProxy, cssProp, { label: field.label, view: 'color' })
          binding.on('change', ({ value }: { value: string }) => {
            selectorStyles[cssProp] = value
            _dispatchLive()
          })
        } else {
          if (!selectorStyles[cssProp]) selectorStyles[cssProp] = ''
          const binding = styleFolder.addBinding(selectorStyles, cssProp, { label: field.label })
          binding.on('change', () => _dispatchLive())
        }
      }
    }
  }
}

// ─── Tweakpane lifecycle (composite child overrides) ─────────────────────────

/** Separate pane instance for child override editing. */
let childPane: Pane | null = null
const childPaneContainer = ref<HTMLDivElement | null>(null)

/** Local mutable copy of the child props being edited (for Tweakpane binding). */
const draftChildProps = ref<Record<string, any>>({})

function rebuildChildPane() {
  if (childPane) {
    childPane.dispose()
    childPane = null
  }

  if (!selectedChild.value || !childSchema.value || !childPaneContainer.value) return

  // Clone child props so Tweakpane can mutate them
  draftChildProps.value = structuredClone(selectedChild.value.props)

  jsonFieldValues.value = {}
  for (const field of childSchema.value.content.fields as any[]) {
    if (field.type === 'json') {
      const v = draftChildProps.value[field.key]
      jsonFieldValues.value[field.key] =
        v == null ? '' : typeof v === 'string' ? v : JSON.stringify(v, null, 2)
    }
  }

  childPane = new Pane({ container: childPaneContainer.value })
  const folder = childPane.addFolder({ title: 'Overrides', expanded: true })

  for (const field of childSchema.value.content.fields as any[]) {
    if (field.type === 'json' || field.type === 'css' || field.type === 'array') continue

    if (field.type === 'color') {
      const colorProxy: Record<string, string> = {
        [field.key]: (draftChildProps.value[field.key] as string) || '#ffffff'
      }
      const binding = folder.addBinding(colorProxy, field.key, { label: field.label, view: 'color' })
      binding.on('change', ({ value }: { value: string }) => {
        draftChildProps.value[field.key] = value
        _dispatchChildOverride()
      })
    } else {
      if (draftChildProps.value[field.key] === undefined || draftChildProps.value[field.key] === null) {
        draftChildProps.value[field.key] = field.type === 'boolean' ? false : ''
      }
      const binding = folder.addBinding(draftChildProps.value, field.key, { label: field.label })
      binding.on('change', () => _dispatchChildOverride())
    }
  }
}

function _dispatchChildOverride() {
  if (!draft.value || !selectedChildId.value) return
  store.updateCompositeOverride(draft.value.id, selectedChildId.value, {
    props: structuredClone(draftChildProps.value)
  })
}

function onChildJsonInput(key: string, event: Event) {
  const raw = (event.target as HTMLTextAreaElement).value
  jsonFieldValues.value[key] = raw
  try {
    draftChildProps.value[key] = JSON.parse(raw)
  } catch {
    draftChildProps.value[key] = raw
  }
  _dispatchChildOverride()
}

// ─── Store dispatch helpers (regular blocks) ──────────────────────────────────

function _dispatchLive() {
  if (!draft.value) return
  const cloned = structuredClone(toRaw(draft.value))
  if (draftContext.value === 'layout') {
    if (store.selectedLayoutBlockId === 'header') {
      store.updateHeader(cloned, { snapshot: false })
    } else if (store.selectedLayoutBlockId === 'footer') {
      store.updateFooter(cloned, { snapshot: false })
    }
  } else {
    store.updateBlock(cloned, { snapshot: false })
  }
}

function _dispatchCommit() {
  if (!draft.value) return
  const cloned = structuredClone(toRaw(draft.value))
  if (draftContext.value === 'layout') {
    if (store.selectedLayoutBlockId === 'header') {
      store.updateHeader(cloned, { snapshot: true })
    } else if (store.selectedLayoutBlockId === 'footer') {
      store.updateFooter(cloned, { snapshot: true })
    }
  } else {
    store.updateBlock(cloned, { snapshot: true })
  }
}

// ─── Textarea field handlers (json / css) ────────────────────────────────────

function onJsonInput(key: string, event: Event) {
  if (!draft.value) return
  const raw = (event.target as HTMLTextAreaElement).value
  jsonFieldValues.value[key] = raw
  try {
    draft.value.props[key] = JSON.parse(raw)
  } catch {
    draft.value.props[key] = raw
  }
  _dispatchLive()
}

function onCssInput(key: string, event: Event) {
  if (!draft.value) return
  const raw = (event.target as HTMLTextAreaElement).value
  ;(draft.value as Record<string, any>)[key] = raw
  _dispatchLive()
}

function getCssValue(key: string): string {
  if (!draft.value) return ''
  return (draft.value as Record<string, any>)[key] ?? ''
}

// ─── Text alignment helpers (type: 'align' style fields) ─────────────────────

const ALIGN_VALUES = ['left', 'center', 'right', 'justify'] as const
type AlignValue = typeof ALIGN_VALUES[number]

function getAlign(field: any): AlignValue | '' {
  if (!draft.value?.styles) return ''
  const selector: string = field.selector ?? ''
  return (draft.value.styles[selector]?.[field.cssProperty] as AlignValue) ?? ''
}

function setAlign(field: any, value: AlignValue) {
  if (!draft.value) return
  const selector: string = field.selector ?? ''
  if (!draft.value.styles) draft.value.styles = {}
  if (!draft.value.styles[selector]) draft.value.styles[selector] = {}
  draft.value.styles[selector][field.cssProperty] = value
  _dispatchLive()
}

// ─── Ungroup ─────────────────────────────────────────────────────────────────

function ungroupCurrent() {
  if (!draft.value || draft.value.type !== 'Composite' || !compositeDef.value) return
  store.replaceBlockWithChildren(draft.value.id, compositeDef.value.children)
}

// ─── Delete block ────────────────────────────────────────────────────────────

function deleteBlock() {
  if (!draft.value || draftContext.value !== 'page') return
  store.removeBlock(draft.value.id)
  // removeBlock clears selectedBlockId → useBlockEditorPanel watch auto-closes the panel
}

// ─── Panel close ────────────────────────────────────────────────────────────

function close() {
  if (draft.value?.type !== 'Composite') {
    _dispatchCommit()
  }
  if (draftContext.value === 'layout') {
    store.selectLayoutBlock(null)
  } else {
    store.selectBlock(null)
  }
}

// ─── Keyboard ───────────────────────────────────────────────────────────────

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isPanelOpen.value) {
    if (selectedChildId.value) {
      selectedChildId.value = null
    } else {
      close()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  if (pane) { pane.dispose(); pane = null }
  if (childPane) { childPane.dispose(); childPane = null }
})
</script>

<template>
  <!-- Backdrop (mobile only) closes the panel on tap outside -->
  <Transition name="backdrop">
    <div
      v-if="isPanelOpen"
      class="panel-backdrop"
      aria-hidden="true"
      @click="close"
    />
  </Transition>

  <!-- Sliding side panel -->
  <Transition name="panel">
    <aside
      v-if="isPanelOpen && draft"
      class="editor-panel"
      role="complementary"
      aria-label="Editor de bloque"
    >
      <!-- ── Composite block panel ─────────────────────────────────────────── -->
      <template v-if="draft.type === 'Composite'">
        <!-- Composite panel header -->
        <div class="panel-header">
          <span class="panel-title">
            <span class="composite-icon">⊞</span>
            {{ compositeDef?.name ?? 'Componente' }}
          </span>
          <div class="panel-header-actions">
            <button
              class="panel-action-btn"
              title="Desagrupar (restaurar bloques originales)"
              @click="ungroupCurrent"
            >
              Desagrupar
            </button>
            <button
              class="panel-close"
              type="button"
              aria-label="Cerrar panel"
              @click="close"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- No definition found -->
        <div v-if="!compositeDef" class="composite-missing-msg">
          <p>⚠ Definición no encontrada</p>
          <p class="composite-missing-id">ID: {{ draft.props.definitionId }}</p>
        </div>

        <!-- Child tree list -->
        <template v-else>
          <div class="composite-children-header">
            <span class="section-label">Bloques hijos</span>
            <span v-if="selectedChildId" class="back-link" @click="selectedChildId = null">← Volver</span>
          </div>

          <!-- Child list view -->
          <ul v-if="!selectedChildId" class="composite-child-list">
            <li
              v-for="child in compositeDef.children"
              :key="child.id"
              class="composite-child-item"
              @click="selectedChildId = child.id"
            >
              <span class="child-type">{{ child.type }}</span>
              <span class="child-arrow">›</span>
            </li>
          </ul>

          <!-- Child override editor -->
          <template v-else-if="selectedChild">
            <div class="child-editor-header">
              <span class="child-editor-type">{{ selectedChild.type }}</span>
              <span class="child-editor-hint">Editando overrides de instancia</span>
            </div>

            <div ref="childPaneContainer" class="pane-container" />

            <!-- Textarea fields for json/css overrides -->
            <div
              v-for="field in childTextareaFields"
              :key="field.key"
              class="textarea-field"
            >
              <label class="textarea-label">{{ field.label }}</label>
              <textarea
                v-if="field.type === 'json'"
                class="field-textarea"
                :value="jsonFieldValues[field.key] ?? ''"
                rows="6"
                @input="onChildJsonInput(field.key, $event)"
              />
            </div>
          </template>
        </template>
      </template>

      <!-- ── Regular block panel ───────────────────────────────────────────── -->
      <template v-else-if="schema">
        <!-- Panel header -->
        <div class="panel-header">
          <span class="panel-title">{{ draft.type }}</span>
          <div class="panel-header-actions">
            <!-- Delete — only available for page blocks, not layout slots -->
            <button
              v-if="draftContext === 'page'"
              class="panel-action-btn panel-delete-btn"
              type="button"
              title="Eliminar bloque (Delete)"
              @click="deleteBlock"
            >🗑</button>
            <button
              class="panel-close"
              type="button"
              aria-label="Cerrar panel"
              @click="close"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Tweakpane mount point — string/boolean/color fields rendered here -->
        <div ref="paneContainer" class="pane-container" />

        <!-- Text alignment toggle buttons (type: 'align' style fields) -->
        <div
          v-for="{ field } in alignFields"
          :key="field.cssProperty"
          class="align-field"
        >
          <span class="align-label">{{ field.label }}</span>
          <div class="align-buttons" role="group" :aria-label="field.label">
            <button
              v-for="val in ['left', 'center', 'right', 'justify']"
              :key="val"
              type="button"
              class="align-btn"
              :class="{ 'align-btn--active': getAlign(field) === val }"
              :title="val"
              :aria-pressed="getAlign(field) === val"
              @click="setAlign(field, val as any)"
            >
              <svg v-if="val === 'left'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
              <svg v-else-if="val === 'center'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
              <svg v-else-if="val === 'right'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
              <svg v-else-if="val === 'justify'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </div>

        <!-- Structured array editors (type: 'array') -->
        <div
          v-for="field in arrayFields"
          :key="field.key"
          class="textarea-field"
        >
          <ArrayField
            :label="field.label"
            :value="draft?.props[field.key]"
            :subfields="field.subfields"
            @update:value="(v: any[]) => { if (draft) { draft.props[field.key] = v; _dispatchLive() } }"
          />
        </div>

        <!-- Plain textareas for json and css fields (legacy / advanced) -->
        <div
          v-for="field in textareaFields"
          :key="field.key"
          class="textarea-field"
        >
          <label class="textarea-label">{{ field.label }}</label>

          <textarea
            v-if="field.type === 'json'"
            class="field-textarea"
            :value="jsonFieldValues[field.key] ?? ''"
            rows="6"
            placeholder='[{"label":"Inicio","href":"/"}]'
            @input="onJsonInput(field.key, $event)"
          />

          <textarea
            v-else-if="field.type === 'css'"
            class="field-textarea field-textarea--css"
            :value="getCssValue(field.key)"
            rows="4"
            placeholder="color: red; font-size: 14px;"
            @input="onCssInput(field.key, $event)"
          />
        </div>
      </template>
    </aside>
  </Transition>
</template>

<style scoped>
/* ── Panel backdrop (mobile overlay) ───────────────────────────────────────── */
.panel-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
  z-index: 99;
}

/* ── Side panel ─────────────────────────────────────────────────────────────── */
.editor-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 320px;
  background: #1e1e1e;
  color: #ebebeb;
  display: flex;
  flex-direction: column;
  z-index: 100;
  overflow-y: auto;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.35);
}

/* Full-width on small screens */
@media (max-width: 600px) {
  .editor-panel {
    width: 100%;
  }

  .panel-backdrop {
    display: none;
  }
}

/* ── Panel header ───────────────────────────────────────────────────────────── */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #333;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  background: #1e1e1e;
  z-index: 1;
  gap: 8px;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #aaa;
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.composite-icon {
  color: #a78bfa;
  font-size: 16px;
  flex-shrink: 0;
}

.panel-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

/* 44×44 px touch target for close button */
.panel-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  color: #aaa;
  font-size: 16px;
  cursor: pointer;
  border-radius: 6px;
  margin-right: -8px;
  transition: background 0.15s, color 0.15s;
}

.panel-close:hover {
  background: #2e2e2e;
  color: #fff;
}

.panel-action-btn {
  padding: 0 10px;
  height: 44px;
  border: 1px solid #555;
  background: transparent;
  color: #bbb;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.panel-action-btn:hover {
  background: #2e2e2e;
  color: #fff;
}

.panel-delete-btn {
  border-color: #6e2020;
  color: #e87070;
  font-size: 14px;
}

.panel-delete-btn:hover {
  background: #6e2020;
  color: #fff;
  border-color: #6e2020;
}

/* ── Composite panel ─────────────────────────────────────────────────────────── */
.composite-missing-msg {
  padding: 16px;
  color: #e87070;
  font-size: 13px;
}

.composite-missing-id {
  font-size: 11px;
  color: #888;
  word-break: break-all;
}

.composite-children-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px 6px;
  border-bottom: 1px solid #2a2a2a;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #666;
}

.back-link {
  font-size: 12px;
  color: #7c9fd9;
  cursor: pointer;
}

.back-link:hover {
  text-decoration: underline;
}

.composite-child-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.composite-child-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid #2a2a2a;
  cursor: pointer;
  transition: background 0.1s;
}

.composite-child-item:hover {
  background: #2a2a2a;
}

.child-type {
  font-size: 13px;
  color: #ddd;
}

.child-arrow {
  font-size: 16px;
  color: #666;
}

.child-editor-header {
  padding: 10px 16px;
  border-bottom: 1px solid #2a2a2a;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.child-editor-type {
  font-size: 13px;
  font-weight: 600;
  color: #ddd;
}

.child-editor-hint {
  font-size: 11px;
  color: #666;
}

/* ── Tweakpane container ────────────────────────────────────────────────────── */
.pane-container {
  padding: 8px 0;
}

/* Override Tweakpane's default fixed width so it fills the panel */
.pane-container :deep(.tp-dfwv) {
  width: 100% !important;
  position: static !important;
}

/* ── Plain textareas (json / css) ──────────────────────────────────────────── */
.textarea-field {
  padding: 10px 12px;
  border-top: 1px solid #2a2a2a;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.textarea-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888;
}

.field-textarea {
  width: 100%;
  box-sizing: border-box;
  background: #111;
  border: 1px solid #333;
  border-radius: 4px;
  color: #e8e8e8;
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.5;
  padding: 8px;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s;
}

.field-textarea:focus {
  border-color: #555;
}

.field-textarea--css {
  rows: 4;
}

/* ── Slide-in / slide-out transition ────────────────────────────────────────── */
.panel-enter-active,
.panel-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.panel-enter-from,
.panel-leave-to {
  transform: translateX(100%);
}

/* Backdrop fade */
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.25s ease;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

/* ── Text alignment toggle ───────────────────────────────────────────────────── */
.align-field {
  padding: 10px 12px;
  border-top: 1px solid #2a2a2a;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.align-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888;
}

.align-buttons {
  display: flex;
  gap: 4px;
}

.align-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid #333;
  background: #111;
  color: #888;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}

.align-btn:hover {
  background: #2a2a2a;
  color: #ddd;
}

.align-btn--active {
  background: #1d3a5e;
  border-color: #3b82f6;
  color: #93c5fd;
}
</style>
