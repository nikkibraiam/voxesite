<script setup lang="ts">
import { ref, watch, computed, toRaw } from 'vue'
import { BlockSchemas } from '@cms/ui/schemas'
import { Modal } from '@cms/ui/base-components'
import type { BaseBlock, BlockStyles } from '@cms/contracts'

const props = defineProps<{
  block: BaseBlock<string, any> | null
}>()

const emit = defineEmits<{
  (e: 'apply', block: BaseBlock<string, any>): void
  (e: 'close'): void
}>()

const draft = ref<BaseBlock<string, any> | null>(null)

watch(
  () => props.block,
  (newBlock) => {
    draft.value = newBlock
      ? structuredClone(toRaw(newBlock))
      : null
  },
  { immediate: true }
)

const schema = computed(() => {
  if (!draft.value) return null
  return BlockSchemas[draft.value.type]
})

function updateStyle(
  selector: string,
  cssProperty: string,
  value: string
) {
  if (!draft.value) return

  if (!draft.value.styles) {
    draft.value.styles = {}
  }

  if (!draft.value.styles[selector]) {
    draft.value.styles[selector] = {}
  }

  draft.value.styles[selector][cssProperty] = value

  // 🔥 emitir cambio en tiempo real
  emit('apply', structuredClone(toRaw(draft.value)))
}

function applyChanges() {
  if (!draft.value) return
  emit('apply', draft.value)
}
</script>

<template>
  <Modal v-if="draft && schema">
    <h3>{{ draft.type }}</h3>

    <!-- 🧩 CONTENIDO -->
    <h4>Contenido</h4>
    <div
      v-for="field in schema.content.fields"
      :key="field.key"
    >
      <label>{{ field.label }}</label>
      <input
        v-model="draft.props[field.key]" @input="applyChanges"
      />
    </div>

    <!-- 🎨 ESTILOS -->
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
      <button @click="emit('close')">Cancelar</button>
      <button @click="applyChanges">Aplicar</button>
    </div>
  </Modal>
</template>
