<script setup lang="ts">
import { computed } from 'vue'
import type { CTABannerProps } from '@cms/contracts'

const props = withDefaults(defineProps<CTABannerProps>(), {
  heading: '¿Listo para empezar?',
  subtext: '',
  buttonLabel: 'Comenzar ahora',
  buttonUrl: '#',
  bgColor: '#1a1a2e',
  textColor: '#ffffff'
})

const bannerStyle = computed(() => ({
  backgroundColor: props.bgColor || '#1a1a2e',
  color: props.textColor || '#ffffff'
}))
</script>

<template>
  <section class="cta-banner" :style="bannerStyle">
    <div class="cta-banner__inner">
      <h2 class="cta-banner__heading">{{ heading }}</h2>
      <p v-if="subtext" class="cta-banner__subtext">{{ subtext }}</p>
      <a
        v-if="buttonLabel && buttonUrl"
        :href="buttonUrl"
        class="cta-banner__btn"
      >
        {{ buttonLabel }}
      </a>
    </div>
  </section>
</template>

<style scoped>
.cta-banner {
  padding: 4rem 1.5rem;
  text-align: center;
}

.cta-banner__inner {
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}

.cta-banner__heading {
  font-size: 2.25rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}

.cta-banner__subtext {
  font-size: 1.125rem;
  margin: 0;
  opacity: 0.85;
}

.cta-banner__btn {
  display: inline-block;
  padding: 0.875rem 2rem;
  min-height: 44px;
  line-height: 1.4;
  background: #fff;
  color: #1a1a2e;
  text-decoration: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  transition: opacity 0.15s, transform 0.15s;
}

.cta-banner__btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

@media (max-width: 600px) {
  .cta-banner__heading {
    font-size: 1.75rem;
  }

  .cta-banner__btn {
    width: 100%;
    text-align: center;
  }
}
</style>
