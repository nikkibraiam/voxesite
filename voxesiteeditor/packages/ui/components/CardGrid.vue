<script setup lang="ts">
import { computed } from 'vue'
import type { CardGridProps, CardItem } from '@cms/contracts'

const props = withDefaults(defineProps<CardGridProps>(), {
  heading: '',
  columns: 3,
  bgColor: '',
  cardBgColor: ''
})

const parsedCards = computed<CardItem[]>(() => {
  if (!props.cards) return []
  if (Array.isArray(props.cards)) return props.cards
  try { return JSON.parse(props.cards as string) } catch { return [] }
})

const gridStyle = computed(() => ({
  '--card-columns': String(props.columns ?? 3),
  backgroundColor: props.bgColor || undefined
}))

const cardStyle = computed(() => ({
  backgroundColor: props.cardBgColor || undefined
}))
</script>

<template>
  <section class="card-grid" :style="gridStyle">
    <div v-if="heading" class="card-grid__heading-wrap">
      <h2 class="card-grid__heading">{{ heading }}</h2>
    </div>
    <div class="card-grid__grid">
      <article
        v-for="(card, i) in parsedCards"
        :key="i"
        class="card-grid__card"
        :style="cardStyle"
      >
        <img
          v-if="card.imageUrl"
          :src="card.imageUrl"
          :alt="card.title"
          class="card-grid__card-img"
          loading="lazy"
        />
        <div class="card-grid__card-body">
          <h3 class="card-grid__card-title">{{ card.title }}</h3>
          <p v-if="card.text" class="card-grid__card-text">{{ card.text }}</p>
          <a
            v-if="card.ctaLabel && card.ctaUrl"
            :href="card.ctaUrl"
            class="card-grid__card-cta"
          >
            {{ card.ctaLabel }}
          </a>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.card-grid {
  padding: 3rem 1.5rem;
}

.card-grid__heading-wrap {
  text-align: center;
  margin-bottom: 2rem;
}

.card-grid__heading {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

.card-grid__grid {
  display: grid;
  grid-template-columns: repeat(var(--card-columns, 3), 1fr);
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.card-grid__card {
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #fff;
  transition: box-shadow 0.2s;
}

.card-grid__card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.card-grid__card-img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  display: block;
}

.card-grid__card-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.card-grid__card-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.card-grid__card-text {
  font-size: 0.9375rem;
  opacity: 0.75;
  margin: 0;
  flex: 1;
}

.card-grid__card-cta {
  display: inline-block;
  margin-top: 0.75rem;
  padding: 0.625rem 1.25rem;
  min-height: 44px;
  line-height: 1.4;
  background: #1a1a2e;
  color: #fff;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
  transition: background 0.15s;
}

.card-grid__card-cta:hover {
  background: #5858c8;
}

@media (max-width: 900px) {
  .card-grid__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 560px) {
  .card-grid__grid {
    grid-template-columns: 1fr;
  }
}
</style>
