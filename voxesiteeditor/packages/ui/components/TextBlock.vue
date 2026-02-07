<script setup lang="ts">
import type { TextBlock } from '@cms/contracts'
import { computed } from 'vue';

const props = defineProps<TextBlock['props']>()
const baseClass = 'text-block'

const classes = computed(() => [
  baseClass,
  props.class
])
</script>

<template>
  <section class="text-block">
    <div :class="classes">
      <p class="text" v-html="text" />
    </div>
  </section>
</template>

<style scoped>
.text-block {
  padding: 1rem 0;
}

.text {
  font-size: 1rem;
  line-height: 1.6;
  color: #13376a;
}
</style>
