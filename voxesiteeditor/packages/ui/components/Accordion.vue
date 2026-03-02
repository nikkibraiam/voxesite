<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AccordionProps, AccordionItem } from '@cms/contracts'

const props = withDefaults(defineProps<AccordionProps>(), {
  openFirst: false,
  openMultiple: false,
})

const parsedItems = computed<AccordionItem[]>(() => {
  if (!props.items) return []
  if (Array.isArray(props.items)) return props.items
  try { return JSON.parse(props.items as string) } catch { return [] }
})

const openSet = ref<Set<number>>(
  props.openFirst ? new Set([0]) : new Set()
)

function toggle(i: number) {
  if (props.openMultiple) {
    const next = new Set(openSet.value)
    next.has(i) ? next.delete(i) : next.add(i)
    openSet.value = next
  } else {
    openSet.value = openSet.value.has(i) ? new Set() : new Set([i])
  }
}
</script>

<template>
  <div class="accordion">
    <div
      v-for="(item, i) in parsedItems"
      :key="i"
      class="accordion__item"
      :class="{ 'accordion__item--open': openSet.has(i) }"
    >
      <button
        class="accordion__trigger"
        type="button"
        :aria-expanded="openSet.has(i)"
        @click="toggle(i)"
      >
        <span class="accordion__title">{{ item.title }}</span>
        <span class="accordion__chevron" aria-hidden="true">
          {{ openSet.has(i) ? '▲' : '▼' }}
        </span>
      </button>
      <div
        v-show="openSet.has(i)"
        class="accordion__panel"
        role="region"
      >
        <div class="accordion__content">{{ item.content }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.accordion {
  padding: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
}

.accordion__item {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  margin-bottom: 0.5rem;
  overflow: hidden;
}

.accordion__trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  min-height: 44px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 1rem;
  font-weight: 500;
  transition: background 0.15s;
}

.accordion__trigger:hover {
  background: rgba(0, 0, 0, 0.03);
}

.accordion__item--open .accordion__trigger {
  background: rgba(88, 88, 200, 0.05);
}

.accordion__title {
  flex: 1;
  line-height: 1.4;
}

.accordion__chevron {
  font-size: 0.75rem;
  opacity: 0.5;
  flex-shrink: 0;
}

.accordion__panel {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.accordion__content {
  padding: 1rem 1.25rem;
  font-size: 0.9375rem;
  line-height: 1.7;
  opacity: 0.8;
  white-space: pre-wrap;
}
</style>
