<script setup lang="ts">
import { computed } from 'vue'
import type { ProgressBarProps } from '@cms/contracts'

const props = withDefaults(defineProps<ProgressBarProps>(), {
  value: 65,
  max: 100,
  label: '',
  color: '#5858c8',
  showPercentage: true,
})

const pct = computed(() => {
  const v = Number(props.value) || 0
  const m = Number(props.max) || 100
  return Math.min(100, Math.max(0, (v / m) * 100))
})
</script>

<template>
  <div class="progress-bar" :style="{ '--pb-color': color }">
    <div v-if="label || showPercentage" class="progress-bar__header">
      <span v-if="label" class="progress-bar__label">{{ label }}</span>
      <span v-if="showPercentage" class="progress-bar__pct">{{ pct.toFixed(0) }}%</span>
    </div>
    <div
      class="progress-bar__track"
      role="progressbar"
      :aria-valuenow="pct"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        class="progress-bar__fill"
        :style="{ width: `${pct}%` }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.progress-bar {
  padding: 0.75rem 1.5rem;
}

.progress-bar__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.9375rem;
}

.progress-bar__label {
  font-weight: 500;
}

.progress-bar__pct {
  font-weight: 700;
  color: var(--pb-color, #5858c8);
}

.progress-bar__track {
  height: 10px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar__fill {
  height: 100%;
  background: var(--pb-color, #5858c8);
  border-radius: 999px;
  transition: width 0.5s ease;
}
</style>
