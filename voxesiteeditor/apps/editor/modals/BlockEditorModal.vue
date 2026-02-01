<script setup lang="ts">
import { computed } from 'vue'
import { BlockSchemas } from '@cms/ui/schemas'
import { Modal } from '@cms/ui/base-components'
import type { Block } from '@cms/contracts'

const props = defineProps<{
  block: Block | null
}>()

const typedBlock = computed(() => {
  if (!props.block) return null
  return props.block
})

const schema = computed(() => {
  if (!props.block) return null
  return BlockSchemas[props.block.type]
})

function resolveFieldComponent(field: any) {
  if (field.type === 'color') return 'input'
  return 'input'
}
</script>

<template>
<Modal v-if="typedBlock && schema">
  <h3>{{ schema.label }}</h3>

  <div v-for="field in schema.fields" :key="field.key">
    <label>{{ field.label }}</label>

    <component
    :is="resolveFieldComponent(field)"
    v-model="(typedBlock.props as Record<string, any>)[field.key]"
    />
  </div>
</Modal>
</template>
