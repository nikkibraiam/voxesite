<script setup lang="ts">
import { HeroBlock } from '@cms/contracts'
import { computed } from 'vue';

const props = defineProps<HeroBlock['props']>()
const baseClass = 'hero__content'
const classes = computed(() => [
  baseClass,
  props.class
])
</script>

<template>
  <section class="hero">
    <div :class="classes">
      <h1 class="hero__title">{{ title }}</h1>

      <h2 v-if="subtitle" class="hero__subtitle">
        {{ subtitle }}
      </h2>

      <p v-if="props.subtitle" class="hero__description">
        {{ props.subtitle }}
      </p>

      <a
        v-if="ctaText && props.ctaText"
        :href="props.ctaText"
        class="hero__cta"
      >
        {{ ctaText }}
      </a>
    </div>

  </section>
</template>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  padding: 4rem 2rem;
}

.hero--left {
  text-align: left;
}

.hero--center {
  text-align: center;
}

.hero--right {
  text-align: right;
}

.hero__title {
  font-size: 3rem;
  font-weight: 700;
}

.hero__subtitle {
  font-size: 1.5rem;
  opacity: 0.8;
}

.hero__description {
  max-width: 600px;
  margin: 1rem auto;
}

.hero__cta {
  display: inline-block;
  margin-top: 2rem;
  padding: 0.75rem 1.5rem;
  background: black;
  color: white;
  text-decoration: none;
  border-radius: 6px;
}
</style>
