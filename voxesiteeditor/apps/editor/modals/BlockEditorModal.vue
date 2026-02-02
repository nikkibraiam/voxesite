<script setup lang="ts">
import { ref, watch } from 'vue'
import { BlockSchemas } from '@cms/ui/schemas'
import { Modal } from '@cms/ui/base-components'
import type { Block } from '@cms/contracts'

const props = defineProps<{
  block: Block | null
}>()

const emit = defineEmits<{
  (e: 'apply', block: Block): void
  (e: 'close'): void
}>()

const draft = ref<Block | null>(null)

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

function applyChanges() {
  if (!draft.value) return
  emit('apply', draft.value)
}
</script>

<template>
  <Modal v-if="draft && schema">
    <h3>{{ schema.label }}</h3>

    <div v-for="field in schema.fields" :key="field.key">
      <label>{{ field.label }}</label>

      <input
        v-model="(draft.props as Record<string, any>)[field.key]"
      />
    </div>

    <div class="actions">
      <button @click="emit('close')">Cancelar</button>
      <button @click="applyChanges">Aplicar</button>
    </div>
  </Modal>
</template>
