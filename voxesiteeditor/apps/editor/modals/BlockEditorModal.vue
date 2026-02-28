<script setup lang="ts">
import { ref, watch, computed, toRaw } from 'vue'
import { BlockSchemas, LayoutSchemas } from '@cms/ui/schemas'
import { Modal } from '@cms/ui/base-components'
import type { BaseBlock } from '@cms/contracts'
import { usePageStore } from '../stores/usePageStore'

const store = usePageStore()

// Local draft — a deep clone of the selected block so v-model edits don't
// mutate the store directly. The draft is committed to the store explicitly.
const draft = ref<BaseBlock<string, any> | null>(null)

/**
 * 'page' when editing a page block, 'layout' when editing a header/footer.
 * Determines which store action to call on apply.
 */
const draftContext = ref<'page' | 'layout'>('page')

// Watch both selectedBlockId and selectedLayoutBlockId.
// Resetting on ID changes means switching blocks resets the draft without
// clobbering in-flight edits on the current block.
watch(
  () => [store.selectedBlockId, store.selectedLayoutBlockId],
  () => {
    if (store.selectedLayoutBlockId) {
      draftContext.value = 'layout'
      const lb = store.selectedLayoutBlock
      draft.value = lb ? structuredClone(toRaw(lb)) : null
    } else {
      draftContext.value = 'page'
      const block = store.selectedBlock
      draft.value = block ? structuredClone(toRaw(block)) : null
    }
  },
  { immediate: true }
)

const schema = computed(() => {
  if (!draft.value) return null
  // Check layout schemas first (LayoutHeader, LayoutFooter),
  // then fall back to page block schemas (Hero, TextBlock, …).
  return LayoutSchemas[draft.value.type] ?? BlockSchemas[draft.value.type] ?? null
})

// Called on every input event (color picker, text field, etc.).
// Updates the store for live preview WITHOUT creating a history snapshot,
// so the undo stack isn't flooded with every keystroke.
function updateStyle(selector: string, cssProperty: string, value: string) {
  if (!draft.value) return

  if (!draft.value.styles) {
    draft.value.styles = {}
  }
  if (!draft.value.styles[selector]) {
    draft.value.styles[selector] = {}
  }
  draft.value.styles[selector][cssProperty] = value

  _dispatchLive()
}

/** Dispatch a live (no-snapshot) update to the correct store action. */
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

/** Dispatch a committed (snapshot) update to the correct store action. */
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

// Called by text/prop inputs — live preview, no history entry.
function applyLive() {
  _dispatchLive()
}

// Called by the "Aplicar" button — commits a proper undo checkpoint.
function applyChanges() {
  _dispatchCommit()
}

/** Close the modal by deselecting everything. */
function close() {
  if (draftContext.value === 'layout') {
    store.selectLayoutBlock(null)
  } else {
    store.selectBlock(null)
  }
}

/**
 * Parse a JSON field value safely. Returns the original string on failure
 * so the user can keep editing.
 */
function parseJsonField(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

/** Handle changes to a JSON textarea. Parses and applies live. */
function onJsonInput(key: string, event: Event) {
  if (!draft.value) return
  const raw = (event.target as HTMLTextAreaElement).value
  draft.value.props[key] = parseJsonField(raw)
  applyLive()
}

/** Return the JSON textarea value for a prop (pretty-printed). */
function jsonValue(key: string): string {
  if (!draft.value) return ''
  const v = draft.value.props[key]
  if (v === undefined || v === null) return ''
  if (typeof v === 'string') return v
  return JSON.stringify(v, null, 2)
}
</script>

<template>
  <Modal v-if="draft && schema">
    <h3>{{ draft.type }}</h3>

    <!-- Contenido -->
    <h4>Contenido</h4>
    <div
      v-for="field in schema.content.fields"
      :key="field.key"
    >
      <label>{{ field.label }}</label>

      <!-- JSON textarea (complex arrays like navLinks, columns) -->
      <textarea
        v-if="field.type === 'json'"
        :value="jsonValue(field.key)"
        rows="6"
        style="font-family: monospace; font-size: 12px; width: 100%;"
        @input="onJsonInput(field.key, $event)"
        placeholder='[{"label":"Inicio","href":"/"}]'
      />

      <!-- Custom CSS textarea -->
      <textarea
        v-else-if="field.type === 'css'"
        v-model="(draft as Record<string, any>)[field.key]"
        @input="applyLive"
        placeholder="color: red; font-size: 14px;"
      />

      <!-- Color input -->
      <input
        v-else-if="field.type === 'color'"
        type="color"
        :value="draft.props[field.key] ?? '#000000'"
        @input="e => { draft!.props[field.key] = (e.target as HTMLInputElement).value; applyLive() }"
      />

      <!-- Boolean checkbox -->
      <input
        v-else-if="field.type === 'boolean'"
        type="checkbox"
        :checked="!!draft.props[field.key]"
        @change="e => { draft!.props[field.key] = (e.target as HTMLInputElement).checked; applyLive() }"
      />

      <!-- Default: plain text input -->
      <input
        v-else
        v-model="draft.props[field.key]"
        @input="applyLive"
      />
    </div>

    <!-- Estilos -->
    <div
      v-for="group in schema.styles"
      :key="group.group"
    >
      <h4>{{ group.group }}</h4>
      <div
        v-for="field in group.fields"
        :key="field.key"
      >
        <label>{{ field.label }}</label>
        <input
          :type="field.type === 'color' ? 'color' : 'text'"
          @input="e => updateStyle(
            field.selector,
            field.cssProperty,
            (e.target as HTMLInputElement).value
          )"
        />
      </div>
    </div>

    <div class="actions">
      <button @click="close">Cancelar</button>
      <button @click="applyChanges">Aplicar</button>
    </div>
  </Modal>
</template>
