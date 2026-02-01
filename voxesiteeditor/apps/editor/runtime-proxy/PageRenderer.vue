<script setup lang="ts">
import { renderBlock } from '@cms/ui'
import { SelectableBlock } from '@cms/ui/wrappers'
import type { Block } from '@cms/contracts'

defineProps<{ blocks: Block[] }>()
</script>

<template>
  <SelectableBlock
    v-for="block in blocks"
    :key="block.id"
    :block-id="block.id"
    enabled
  >
    <component
      :is="renderBlock(block)"
      v-bind="block.props"
    />
  </SelectableBlock>
</template>
