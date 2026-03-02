<script setup lang="ts">
import { computed } from 'vue'
import type { LogoCloudProps, LogoItem } from '@cms/contracts'

const props = withDefaults(defineProps<LogoCloudProps>(), {
  title: '',
  grayscale: true
})

const parsedLogos = computed<LogoItem[]>(() => {
  if (!props.logos) return []
  if (Array.isArray(props.logos)) return props.logos
  try { return JSON.parse(props.logos as string) } catch { return [] }
})
</script>

<template>
  <section class="logo-cloud">
    <p v-if="title" class="logo-cloud__title">{{ title }}</p>
    <div class="logo-cloud__row">
      <component
        :is="logo.url ? 'a' : 'div'"
        v-for="(logo, i) in parsedLogos"
        :key="i"
        :href="logo.url || undefined"
        :target="logo.url ? '_blank' : undefined"
        :rel="logo.url ? 'noopener noreferrer' : undefined"
        class="logo-cloud__item"
      >
        <img
          :src="logo.imageUrl"
          :alt="logo.alt ?? `Logo ${i + 1}`"
          class="logo-cloud__img"
          :class="{ 'logo-cloud__img--grayscale': grayscale }"
          loading="lazy"
        />
      </component>
    </div>
  </section>
</template>

<style scoped>
.logo-cloud {
  padding: 2.5rem 1.5rem;
  text-align: center;
}

.logo-cloud__title {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.5;
  margin: 0 0 1.5rem;
  font-weight: 600;
}

.logo-cloud__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 2.5rem 3rem;
  max-width: 1100px;
  margin: 0 auto;
}

.logo-cloud__item {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.logo-cloud__img {
  height: 40px;
  object-fit: contain;
  display: block;
  transition: filter 0.2s, opacity 0.2s;
  opacity: 0.65;
}

.logo-cloud__img--grayscale {
  filter: grayscale(100%);
}

.logo-cloud__item:hover .logo-cloud__img {
  filter: none;
  opacity: 1;
}

@media (max-width: 600px) {
  .logo-cloud__img {
    height: 32px;
  }
}
</style>
