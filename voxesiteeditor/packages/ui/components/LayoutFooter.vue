<script setup lang="ts">
import { computed } from 'vue'
import type { FooterProps, FooterColumn } from '@cms/contracts'

const props = withDefaults(defineProps<FooterProps>(), {
  columns: () => [],
  copyrightText: '',
  backgroundColor: '#1a1a1a'
})

const parsedColumns = computed<FooterColumn[]>(() => {
  if (!props.columns) return []
  if (Array.isArray(props.columns)) return props.columns
  // Handle JSON string case (e.g. when coming from a textarea in the editor)
  try {
    return JSON.parse(props.columns as unknown as string)
  } catch {
    return []
  }
})

const footerStyle = computed(() => ({
  backgroundColor: props.backgroundColor ?? '#1a1a1a'
}))

const footerTextColor = computed(() => {
  // Use white text on dark backgrounds, dark on light
  const bg = props.backgroundColor ?? '#1a1a1a'
  const isDark = isColorDark(bg)
  return { color: isDark ? '#e5e7eb' : '#1a1a1a' }
})

/**
 * Cheap luminance heuristic for hex colors (#rrggbb or #rgb).
 * Returns true when the color is considered "dark".
 */
function isColorDark(hex: string): boolean {
  const clean = hex.replace('#', '')
  if (clean.length === 3) {
    const r = parseInt(clean[0]! + clean[0]!, 16)
    const g = parseInt(clean[1]! + clean[1]!, 16)
    const b = parseInt(clean[2]! + clean[2]!, 16)
    return (r * 299 + g * 587 + b * 114) / 1000 < 128
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16)
    const g = parseInt(clean.slice(2, 4), 16)
    const b = parseInt(clean.slice(4, 6), 16)
    return (r * 299 + g * 587 + b * 114) / 1000 < 128
  }
  return true // default to dark
}
</script>

<template>
  <footer
    class="layout-footer"
    :style="{ ...footerStyle, ...footerTextColor }"
  >
    <div class="layout-footer__inner">
      <!-- Column groups -->
      <div class="layout-footer__columns" v-if="parsedColumns.length">
        <div
          v-for="(col, i) in parsedColumns"
          :key="i"
          class="layout-footer__column"
        >
          <h3 class="layout-footer__column-title">{{ col.title }}</h3>
          <ul class="layout-footer__link-list">
            <li
              v-for="link in col.links"
              :key="link.href"
              class="layout-footer__link-item"
            >
              <a :href="link.href" class="layout-footer__link">
                {{ link.label }}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Copyright bar -->
      <div class="layout-footer__bottom" v-if="copyrightText">
        <p class="layout-footer__copyright">{{ copyrightText }}</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.layout-footer {
  width: 100%;
}

.layout-footer__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1.5rem 1.5rem;
}

/* Columns */
.layout-footer__columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 2rem;
  margin-bottom: 2.5rem;
}

.layout-footer__column-title {
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  opacity: 0.7;
  margin-bottom: 0.875rem;
}

.layout-footer__link-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.layout-footer__link {
  text-decoration: none;
  color: inherit;
  font-size: 0.9375rem;
  opacity: 0.75;
  transition: opacity 0.15s;
}

.layout-footer__link:hover {
  opacity: 1;
}

/* Copyright bar */
.layout-footer__bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1.25rem;
  margin-top: 0;
}

.layout-footer__copyright {
  font-size: 0.8125rem;
  opacity: 0.55;
  margin: 0;
}

@media (max-width: 640px) {
  .layout-footer__columns {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1.5rem;
  }
}
</style>
