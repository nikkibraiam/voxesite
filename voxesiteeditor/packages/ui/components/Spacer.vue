<script setup lang="ts">
import { computed } from 'vue'
import type { SpacerProps } from '@cms/contracts'

const props = withDefaults(defineProps<SpacerProps>(), {
  height: 'md',
  customHeight: '4rem',
})

const heightMap: Record<string, string> = {
  xs: '1rem',
  sm: '2rem',
  md: '4rem',
  lg: '6rem',
  xl: '10rem',
}

const resolvedHeight = computed(() => {
  if (props.height === 'custom') return props.customHeight ?? '4rem'
  return heightMap[props.height ?? 'md'] ?? '4rem'
})
</script>

<template>
  <div
    class="spacer"
    :style="{ height: resolvedHeight }"
    role="presentation"
    aria-hidden="true"
  ></div>
</template>

<style scoped>
.spacer {
  display: block;
  width: 100%;
}
</style>
