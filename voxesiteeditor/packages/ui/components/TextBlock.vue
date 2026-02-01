<script setup lang="ts">
import type { TextBlock } from '@cms/contracts'

const props = defineProps<TextBlock['props']>()
</script>

<template>
  <section class="text-block">
    <p class="text">
      {{ props.text }}
    </p>
  </section>
</template>

<style scoped>
.text-block {
  padding: 1rem 0;
}

.text {
  font-size: 1rem;
  line-height: 1.6;
  color: #1f2937; /* gris elegante */
}
</style>
