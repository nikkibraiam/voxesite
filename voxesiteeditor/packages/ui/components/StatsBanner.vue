<script setup lang="ts">
import { computed } from 'vue'
import type { StatsBannerProps, StatItem } from '@cms/contracts'

const props = withDefaults(defineProps<StatsBannerProps>(), {
  bgColor: '#1a1a2e',
  textColor: '#ffffff',
  columns: 4
})

const parsedStats = computed<StatItem[]>(() => {
  if (!props.stats) return []
  if (Array.isArray(props.stats)) return props.stats
  try { return JSON.parse(props.stats as string) } catch { return [] }
})

const bannerStyle = computed(() => ({
  backgroundColor: props.bgColor || '#1a1a2e',
  color: props.textColor || '#ffffff',
  '--stats-columns': String(props.columns ?? 4)
}))
</script>

<template>
  <section class="stats-banner" :style="bannerStyle">
    <div class="stats-banner__grid">
      <div
        v-for="(stat, i) in parsedStats"
        :key="i"
        class="stats-banner__item"
      >
        <span v-if="stat.icon" class="stats-banner__icon" aria-hidden="true">{{ stat.icon }}</span>
        <span class="stats-banner__value">{{ stat.value }}</span>
        <span class="stats-banner__label">{{ stat.label }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stats-banner {
  padding: 3rem 1.5rem;
}

.stats-banner__grid {
  display: grid;
  grid-template-columns: repeat(var(--stats-columns, 4), 1fr);
  gap: 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

.stats-banner__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.375rem;
}

.stats-banner__icon {
  font-size: 2rem;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stats-banner__value {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1;
}

.stats-banner__label {
  font-size: 0.9375rem;
  opacity: 0.75;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 500;
}

@media (max-width: 768px) {
  .stats-banner__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 420px) {
  .stats-banner__grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
