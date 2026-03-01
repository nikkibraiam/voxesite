<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FAQProps, FAQItem } from '@cms/contracts'

const props = withDefaults(defineProps<FAQProps>(), {
  heading: 'Preguntas frecuentes',
  openMultiple: false
})

const parsedItems = computed<FAQItem[]>(() => {
  if (!props.items) return []
  if (Array.isArray(props.items)) return props.items
  try { return JSON.parse(props.items as string) } catch { return [] }
})

const openSet = ref<Set<number>>(new Set())

function toggle(index: number) {
  if (openSet.value.has(index)) {
    openSet.value.delete(index)
    openSet.value = new Set(openSet.value)
  } else {
    if (!props.openMultiple) {
      openSet.value = new Set([index])
    } else {
      openSet.value.add(index)
      openSet.value = new Set(openSet.value)
    }
  }
}

function isOpen(index: number) {
  return openSet.value.has(index)
}
</script>

<template>
  <section class="faq">
    <div v-if="heading" class="faq__heading-wrap">
      <h2 class="faq__heading">{{ heading }}</h2>
    </div>

    <div class="faq__list" role="list">
      <div
        v-for="(item, i) in parsedItems"
        :key="i"
        class="faq__item"
        :class="{ 'faq__item--open': isOpen(i) }"
        role="listitem"
      >
        <button
          class="faq__question"
          :aria-expanded="isOpen(i)"
          :aria-controls="`faq-answer-${i}`"
          @click="toggle(i)"
        >
          <span class="faq__question-text">{{ item.question }}</span>
          <span class="faq__chevron" aria-hidden="true">{{ isOpen(i) ? '−' : '+' }}</span>
        </button>

        <div
          :id="`faq-answer-${i}`"
          class="faq__answer"
          role="region"
          :hidden="!isOpen(i)"
        >
          <p class="faq__answer-text">{{ item.answer }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.faq {
  padding: 3rem 1.5rem;
}

.faq__heading-wrap {
  text-align: center;
  margin-bottom: 2rem;
}

.faq__heading {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

.faq__list {
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.faq__item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.faq__item:first-child {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.faq__question {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.125rem 0;
  min-height: 44px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 1rem;
  font-weight: 600;
  transition: color 0.15s;
}

.faq__question:hover {
  color: #5858c8;
}

.faq__question-text {
  flex: 1;
}

.faq__chevron {
  font-size: 1.25rem;
  font-weight: 400;
  flex-shrink: 0;
  line-height: 1;
  color: #888;
  transition: color 0.15s;
  width: 20px;
  text-align: center;
}

.faq__item--open .faq__chevron {
  color: #5858c8;
}

.faq__answer {
  overflow: hidden;
}

.faq__answer[hidden] {
  display: none;
}

.faq__answer-text {
  padding: 0 0 1.125rem;
  font-size: 0.9375rem;
  line-height: 1.7;
  margin: 0;
  opacity: 0.8;
}

@media (max-width: 600px) {
  .faq__question {
    font-size: 0.9375rem;
  }
}
</style>
