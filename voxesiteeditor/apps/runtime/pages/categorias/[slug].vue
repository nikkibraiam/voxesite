<script setup lang="ts">
import type { Product } from '@cms/contracts'

// ISR is configured via routeRules in nuxt.config.ts — no SSR/ISR logic here.

const route = useRoute()
const catSlug = route.params.slug as string
const config = useRuntimeConfig()
const siteId = (config.public as any).siteId ?? 'demosite'

const { data, error } = await useAsyncData(
  `category-${catSlug}`,
  () =>
    $fetch<{ ok: boolean; products: Product[] }>(
      `/api/${siteId}/products/category/${catSlug}`
    )
)

const products = computed(() => data.value?.products ?? [])

// ─── SEO ──────────────────────────────────────────────────────────────────────
useSeoMeta({
  title: `Categoría: ${catSlug}`,
  description: `Productos en la categoría ${catSlug}.`,
})
</script>

<template>
  <div class="category-page">
    <header class="category-header">
      <h1>{{ catSlug }}</h1>
      <p v-if="products.length > 0" class="category-count">
        {{ products.length }} productos
      </p>
    </header>

    <div v-if="error" class="category-error">
      <p>No se pudo cargar la categoría.</p>
    </div>

    <div v-else-if="products.length === 0" class="category-empty">
      <p>No hay productos en esta categoría.</p>
    </div>

    <ul v-else class="category-grid">
      <li v-for="product in products" :key="product.id" class="product-card">
        <NuxtLink :to="`/productos/${product.slug}`" class="product-card-link">
          <img
            v-if="product.images?.[0]"
            :src="product.images[0]"
            :alt="product.name"
            class="product-card-image"
            loading="lazy"
          />
          <div class="product-card-body">
            <h2 class="product-card-name">{{ product.name }}</h2>
            <div class="product-card-pricing">
              <span class="product-card-price">
                {{ product.currency }} {{ product.price.toLocaleString() }}
              </span>
              <span v-if="product.originalPrice" class="product-card-original">
                {{ product.currency }} {{ product.originalPrice.toLocaleString() }}
              </span>
            </div>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.category-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.category-header {
  margin-bottom: 2rem;
}

.category-header h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  text-transform: capitalize;
}

.category-count {
  color: #666;
  margin: 0;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.product-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.product-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.product-card-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.product-card-image {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}

.product-card-body {
  padding: 1rem;
}

.product-card-name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
}

.product-card-pricing {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.product-card-price {
  font-size: 1rem;
  font-weight: 700;
  color: #111;
}

.product-card-original {
  font-size: 0.85rem;
  color: #999;
  text-decoration: line-through;
}

.category-error,
.category-empty {
  padding: 4rem 0;
  text-align: center;
  color: #666;
}
</style>
