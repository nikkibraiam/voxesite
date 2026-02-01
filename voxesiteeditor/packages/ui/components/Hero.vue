<script setup lang="ts">
interface HeroProps {
  title: string
  subtitle?: string
  description?: string
  image?: string
  ctaText?: string
  ctaHref?: string
  align?: 'left' | 'center' | 'right'
}

const props = withDefaults(defineProps<HeroProps>(), {
  align: 'center',
})
</script>

<template>
  <section class="hero" :class="`hero--${align}`">
    <div class="hero__content">
      <h1 class="hero__title">{{ title }}</h1>

      <h2 v-if="subtitle" class="hero__subtitle">
        {{ subtitle }}
      </h2>

      <p v-if="description" class="hero__description">
        {{ description }}
      </p>

      <a
        v-if="ctaText && ctaHref"
        :href="ctaHref"
        class="hero__cta"
      >
        {{ ctaText }}
      </a>
    </div>

    <div v-if="image" class="hero__image">
      <img :src="image" :alt="title" />
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
