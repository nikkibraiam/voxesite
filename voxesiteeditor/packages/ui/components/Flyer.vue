<script setup lang="ts">
import { computed } from 'vue'
import type { FlyerProps } from '@cms/contracts'

const props = withDefaults(defineProps<FlyerProps>(), {
  bgImageUrl: '',
  title: '',
  subtitle: '',
  overlay: true,
  overlayOpacity: 0.5,
  textColor: '#ffffff'
})

const sectionStyle = computed(() => ({
  '--flyer-bg': props.bgImageUrl ? `url(${props.bgImageUrl})` : 'none',
  '--flyer-overlay-opacity': String(props.overlayOpacity ?? 0.5),
  color: props.textColor || '#ffffff'
}))
</script>

<template>
  <section class="flyer" :style="sectionStyle">
    <div v-if="overlay" class="flyer__overlay" aria-hidden="true" />
    <div class="flyer__content">
      <h2 v-if="title" class="flyer__title">{{ title }}</h2>
      <p v-if="subtitle" class="flyer__subtitle">{{ subtitle }}</p>
    </div>
  </section>
</template>

<style scoped>
.flyer {
  position: relative;
  min-height: 420px;
  background-image: var(--flyer-bg);
  background-size: cover;
  background-position: center;
  background-color: #1a1a2e;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
}

.flyer__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, var(--flyer-overlay-opacity, 0.5));
  pointer-events: none;
}

.flyer__content {
  position: relative;
  z-index: 1;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.flyer__title {
  font-size: clamp(2rem, 6vw, 3.5rem);
  font-weight: 800;
  margin: 0;
  line-height: 1.1;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
}

.flyer__subtitle {
  font-size: clamp(1rem, 2.5vw, 1.375rem);
  margin: 0;
  opacity: 0.9;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.3);
}

@media (max-width: 600px) {
  .flyer {
    min-height: 280px;
    padding: 3rem 1.5rem;
  }
}
</style>
