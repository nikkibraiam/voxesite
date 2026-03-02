<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ProductGridProps, ProductCardProps } from '@cms/contracts'
import ProductCardComponent from './ProductCard.vue'

const props = withDefaults(defineProps<ProductGridProps>(), {
  heading: '',
  columns: 3,
  showFilter: false,
  filterKey: 'badge',
})

const parsedProducts = computed<ProductCardProps[]>(() => {
  if (!props.products) return []
  if (Array.isArray(props.products)) return props.products
  try { return JSON.parse(props.products as string) } catch { return [] }
})

const activeFilter = ref<string>('all')

const filterValues = computed(() => {
  if (!props.showFilter || !props.filterKey) return []
  const key = props.filterKey as keyof ProductCardProps
  const vals = new Set<string>()
  for (const p of parsedProducts.value) {
    const v = p[key] as string | undefined
    if (v) vals.add(v)
  }
  return Array.from(vals)
})

const displayedProducts = computed(() => {
  if (!props.showFilter || activeFilter.value === 'all') return parsedProducts.value
  const key = props.filterKey as keyof ProductCardProps
  return parsedProducts.value.filter(p => (p[key] as string) === activeFilter.value)
})

const gridStyle = computed(() => ({ '--grid-columns': String(props.columns ?? 3) }))
</script>

<template>
  <section class="product-grid">
    <div v-if="heading" class="product-grid__heading-wrap">
      <h2 class="product-grid__heading">{{ heading }}</h2>
    </div>

    <div v-if="showFilter && filterValues.length" class="product-grid__filters">
      <button
        class="product-grid__filter"
        :class="{ 'product-grid__filter--active': activeFilter === 'all' }"
        type="button"
        @click="activeFilter = 'all'"
      >Todos</button>
      <button
        v-for="val in filterValues"
        :key="val"
        class="product-grid__filter"
        :class="{ 'product-grid__filter--active': activeFilter === val }"
        type="button"
        @click="activeFilter = val"
      >{{ val }}</button>
    </div>

    <div class="product-grid__grid" :style="gridStyle">
      <ProductCardComponent
        v-for="(product, i) in displayedProducts"
        :key="i"
        v-bind="product"
      />
    </div>
  </section>
</template>

<style scoped>
.product-grid {
  padding: 3rem 1.5rem;
}

.product-grid__heading-wrap {
  text-align: center;
  margin-bottom: 2rem;
}

.product-grid__heading {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

.product-grid__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.product-grid__filter {
  padding: 0.375rem 1rem;
  min-height: 44px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 999px;
  background: none;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.product-grid__filter--active {
  background: #5858c8;
  color: #fff;
  border-color: #5858c8;
}

.product-grid__grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-columns, 3), 1fr);
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 900px) {
  .product-grid__grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 560px) {
  .product-grid__grid { grid-template-columns: 1fr; }
}
</style>
