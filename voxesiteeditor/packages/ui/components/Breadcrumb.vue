<script setup lang="ts">
import { computed } from 'vue'
import type { BreadcrumbProps, BreadcrumbItem } from '@cms/contracts'

const props = withDefaults(defineProps<BreadcrumbProps>(), {
  separator: '/'
})

const parsedItems = computed<BreadcrumbItem[]>(() => {
  if (!props.items) return []
  if (Array.isArray(props.items)) return props.items
  try { return JSON.parse(props.items as string) } catch { return [] }
})
</script>

<template>
  <nav class="breadcrumb" aria-label="Navegación de migas de pan">
    <ol class="breadcrumb__list" role="list">
      <li
        v-for="(item, i) in parsedItems"
        :key="i"
        class="breadcrumb__item"
      >
        <span v-if="i > 0" class="breadcrumb__sep" aria-hidden="true">{{ separator }}</span>
        <a
          v-if="item.href && i < parsedItems.length - 1"
          :href="item.href"
          class="breadcrumb__link"
        >{{ item.label }}</a>
        <span
          v-else
          class="breadcrumb__current"
          :aria-current="i === parsedItems.length - 1 ? 'page' : undefined"
        >{{ item.label }}</span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.breadcrumb {
  padding: 0.75rem 1.5rem;
}

.breadcrumb__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0;
  font-size: 0.875rem;
}

.breadcrumb__item {
  display: flex;
  align-items: center;
}

.breadcrumb__sep {
  margin: 0 0.5rem;
  opacity: 0.4;
  font-size: 0.875rem;
}

.breadcrumb__link {
  color: #5858c8;
  text-decoration: none;
  padding: 0.25rem 0;
  min-height: 44px;
  display: flex;
  align-items: center;
}

.breadcrumb__link:hover {
  text-decoration: underline;
}

.breadcrumb__current {
  opacity: 0.6;
  font-weight: 500;
}
</style>
