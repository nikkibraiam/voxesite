<script setup lang="ts">
import type { DividerProps } from '@cms/contracts'

withDefaults(defineProps<DividerProps>(), {
  style: 'line',
  margin: 'md',
})
</script>

<template>
  <div
    class="divider"
    :class="[`divider--${style ?? 'line'}`, `divider--margin-${margin ?? 'md'}`]"
    role="separator"
    aria-hidden="true"
  >
    <span v-if="style === 'dots'" class="divider__dots">· · ·</span>
    <svg
      v-else-if="style === 'wave'"
      class="divider__wave"
      viewBox="0 0 1200 20"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M0,10 C150,20 350,0 600,10 C850,20 1050,0 1200,10" stroke="currentColor" stroke-width="2" fill="none"/>
    </svg>
  </div>
</template>

<style scoped>
.divider--margin-sm { margin: 1rem 0; }
.divider--margin-md { margin: 2rem 0; }
.divider--margin-lg { margin: 3.5rem 0; }

/* Line */
.divider--line {
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}

/* Dots */
.divider--dots {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.divider__dots {
  font-size: 1.5rem;
  letter-spacing: 0.5em;
  opacity: 0.35;
}

/* Wave */
.divider--wave {
  display: flex;
  align-items: center;
  border: none;
  opacity: 0.3;
}

.divider__wave {
  width: 100%;
  height: 20px;
  color: currentColor;
}

/* Fade */
.divider--fade {
  border: none;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(0,0,0,0.2), transparent);
}
</style>
