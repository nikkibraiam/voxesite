<script setup lang="ts">
import { ref, watch, computed, toRaw, onMounted, onUnmounted, nextTick } from 'vue'
import { Pane } from 'tweakpane'
import { BlockSchemas, LayoutSchemas } from '@cms/ui/schemas'
import type { BaseBlock } from '@cms/contracts'
import { usePageStore } from '../stores/usePageStore'
import { useBlockEditorPanel } from '../composables/useBlockEditorPanel'

const store = usePageStore()
const { isPanelOpen } = useBlockEditorPanel()

const paneContainer = ref<HTMLDivElement | null>(null)
const draft = ref<BaseBlock<string, any> | null>(null)
const draftContext = ref<'page' | 'layout'>('page')

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
  return LayoutSchemas[draft.value.type] ?? BlockSchemas[draft.value.type] ?? null
})

/** Schema content fields that need plain textareas (not handled by Tweakpane). */
const textareaFields = computed(() => {
  if (!schema.value) return []
  return (schema.value.content.fields as any[]).filter(
    (f: any) => f.type === 'json' || f.type === 'css'
  )
})

// ─── Selection watch — rebuild draft + Tweakpane pane ───────────────────────

watch(
  () => [store.selectedBlockId, store.selectedLayoutBlockId] as const,
  ([blockId, layoutSlot]) => {
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

// ─── Tweakpane lifecycle ─────────────────────────────────────────────────────

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
    // json and css are rendered as plain <textarea> elements below the pane
    if (field.type === 'json' || field.type === 'css') continue

    // Ensure props have a safe initial value for Tweakpane
    if (draft.value.props[field.key] === undefined || draft.value.props[field.key] === null) {
      if (field.type === 'boolean') draft.value.props[field.key] = false
      else if (field.type === 'color') draft.value.props[field.key] = '#000000'
      else draft.value.props[field.key] = ''
    }
    // Color must be a non-empty hex string
    if (field.type === 'color' && !draft.value.props[field.key]) {
      draft.value.props[field.key] = '#000000'
    }

    const params: Record<string, unknown> = { label: field.label }
    if (field.type === 'color') params.view = 'color'

    const binding = contentFolder.addBinding(draft.value.props, field.key, params)
    binding.on('change', () => _dispatchLive())
  }

  // ── Style groups ────────────────────────────────────────────────────────
  if (schema.value.styles?.length) {
    for (const group of schema.value.styles as any[]) {
      const styleFolder = pane.addFolder({ title: group.group, expanded: false })

      if (!draft.value.styles) draft.value.styles = {}

      for (const field of group.fields as any[]) {
        const selector: string = field.selector ?? ''
        const cssProp: string = field.cssProperty

        if (!draft.value.styles[selector]) draft.value.styles[selector] = {}
        // Ensure a valid initial value exists
        if (!draft.value.styles[selector][cssProp]) {
          draft.value.styles[selector][cssProp] = field.type === 'color' ? '#000000' : ''
        }

        const styleProxy = draft.value.styles[selector]
        const params: Record<string, unknown> = { label: field.label }
        if (field.type === 'color') params.view = 'color'

        const binding = styleFolder.addBinding(styleProxy, cssProp, params)
        binding.on('change', () => _dispatchLive())
      }
    }
  }
}

// ─── Store dispatch helpers ──────────────────────────────────────────────────

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

/**
 * CSS fields bind to the block root (draft.customCss) or draft.props[key]
 * depending on the field key. The existing modal uses `draft[field.key]`.
 */
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

// ─── Panel close ────────────────────────────────────────────────────────────

function close() {
  _dispatchCommit()
  if (draftContext.value === 'layout') {
    store.selectLayoutBlock(null)
  } else {
    store.selectBlock(null)
  }
}

// ─── Keyboard ───────────────────────────────────────────────────────────────

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isPanelOpen.value) close()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  if (pane) {
    pane.dispose()
    pane = null
  }
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
      v-if="isPanelOpen && draft && schema"
      class="editor-panel"
      role="complementary"
      aria-label="Editor de bloque"
    >
      <!-- Panel header -->
      <div class="panel-header">
        <span class="panel-title">{{ draft.type }}</span>
        <button
          class="panel-close"
          type="button"
          aria-label="Cerrar panel"
          @click="close"
        >
          ✕
        </button>
      </div>

      <!-- Tweakpane mount point — string/boolean/color fields rendered here -->
      <div ref="paneContainer" class="pane-container" />

      <!-- Plain textareas for json and css fields (Tweakpane doesn't handle these) -->
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
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #aaa;
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
</style>
