<script setup lang="ts">
const props = defineProps<{
  blockId: string
  enabled?: boolean
}>()

function onClick() {
  if (!props.enabled) return

  window.parent.postMessage(
    {
      type: 'BLOCK_SELECT',
      blockId: props.blockId
    },
    '*'
  )
}
</script>

<template>
  <div
    class="selectable-block"
    @click.stop="onClick"
  >
    <slot />
  </div>
</template>

<style scoped>
.selectable-block {
  position: relative;
}

.selectable-block:hover {
  outline: 2px solid rgba(59, 130, 246, 0.8);
  cursor: pointer;
}
</style>
