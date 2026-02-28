<script setup lang="ts">
import { ref, watch, computed, toRaw } from 'vue'
import { BlockSchemas } from '@cms/ui/schemas'
import { Modal } from '@cms/ui/base-components'
import type { BaseBlock } from '@cms/contracts'
import { usePageStore } from '../stores/usePageStore'

const store = usePageStore()

// Local draft — a deep clone of the selected block so v-model edits don't
// mutate the store directly. The draft is committed to the store explicitly.
const draft = ref<BaseBlock<string, any> | null>(null)

// Watch the selected block ID (not the full block object) to avoid a
// circular update loop: updateStyle → store.updateBlock → selectedBlock
// computed changes → watch fires → draft reset (undoing the user's edit).
// Resetting only on ID change means switching blocks resets the draft,
// but in-flight edits on the current block are never clobbered.
watch(
  () => store.selectedBlockId,
  () => {
    const block = store.selectedBlock
    draft.value = block ? structuredClone(toRaw(block)) : null
  },
  { immediate: true }
)

const schema = computed(() => {
  if (!draft.value) return null
  return BlockSchemas[draft.value.type]
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

  store.updateBlock(structuredClone(toRaw(draft.value)), { snapshot: false })
}

// Called by text/prop inputs — live preview, no history entry.
function applyLive() {
  if (!draft.value) return
  store.updateBlock(structuredClone(toRaw(draft.value)), { snapshot: false })
}

// Called by the "Aplicar" button — commits a proper undo checkpoint.
function applyChanges() {
  if (!draft.value) return
  store.updateBlock(structuredClone(toRaw(draft.value)), { snapshot: true })
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
      <textarea
        v-if="field.type === 'css'"
        v-model="(draft as Record<string, any>)[field.key]"
        @input="applyLive"
        placeholder="color: red; font-size: 14px;"
      />
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
      <button @click="store.selectBlock(null)">Cancelar</button>
      <button @click="applyChanges">Aplicar</button>
    </div>
  </Modal>
</template>
