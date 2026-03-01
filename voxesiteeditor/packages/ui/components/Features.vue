<script setup lang="ts">
import { computed } from 'vue'
import type { FeaturesProps, Feature } from '@cms/contracts'

const props = withDefaults(defineProps<FeaturesProps>(), {
  heading: '',
  subheading: '',
  columns: 3
})

const parsedFeatures = computed<Feature[]>(() => {
  if (!props.features) return []
  if (Array.isArray(props.features)) return props.features
  try { return JSON.parse(props.features as string) } catch { return [] }
})

const gridStyle = computed(() => ({
  '--feat-columns': String(props.columns ?? 3)
}))
</script>

<template>
  <section class="features">
    <div v-if="heading || subheading" class="features__header">
      <h2 v-if="heading" class="features__heading">{{ heading }}</h2>
      <p v-if="subheading" class="features__subheading">{{ subheading }}</p>
    </div>

    <div class="features__grid" :style="gridStyle">
      <article
        v-for="(feat, i) in parsedFeatures"
        :key="i"
        class="features__item"
      >
        <div v-if="feat.icon" class="features__icon" aria-hidden="true">{{ feat.icon }}</div>
        <h3 class="features__item-title">{{ feat.title }}</h3>
        <p v-if="feat.description" class="features__item-desc">{{ feat.description }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.features {
  padding: 3rem 1.5rem;
}

.features__header {
  text-align: center;
  margin-bottom: 2.5rem;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.features__heading {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.75rem;
}

.features__subheading {
  font-size: 1.0625rem;
  opacity: 0.7;
  margin: 0;
}

.features__grid {
  display: grid;
  grid-template-columns: repeat(var(--feat-columns, 3), 1fr);
  gap: 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

.features__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.75rem;
}

.features__icon {
  font-size: 2.5rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 50%;
  flex-shrink: 0;
}

.features__item-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.features__item-desc {
  font-size: 0.9375rem;
  opacity: 0.7;
  margin: 0;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .features__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .features__grid {
    grid-template-columns: 1fr;
  }
}
</style>
