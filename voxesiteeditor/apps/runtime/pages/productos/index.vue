<script setup lang="ts">
import type { Product } from '@cms/contracts'

// ISR is configured via routeRules in nuxt.config.ts — no SSR/ISR logic here.

const route = useRoute()
const config = useRuntimeConfig()
const siteId = (config.public as any).siteId ?? 'demosite'

const currentPage = computed(() => parseInt(String(route.query.page ?? '1'), 10))
const category = computed(() => route.query.category ? String(route.query.category) : undefined)

const { data, error } = await useAsyncData(
  `products-page-${currentPage.value}-${category.value ?? 'all'}`,
  () =>
    $fetch<{ ok: boolean; products: Product[]; total: number; page: number; limit: number }>(
      `/api/${siteId}/products`,
      {
        query: {
          page: currentPage.value,
          limit: 24,
          ...(category.value ? { category: category.value } : {}),
        },
      }
    )
)

const products = computed(() => data.value?.products ?? [])
const total = computed(() => data.value?.total ?? 0)
const limit = computed(() => data.value?.limit ?? 24)
const totalPages = computed(() => Math.ceil(total.value / limit.value))

// ─── SEO ──────────────────────────────────────────────────────────────────────
useSeoMeta({
  title: category.value ? `Categoría: ${category.value}` : 'Productos',
  description: 'Explora nuestro catálogo de productos.',
})
</script>

<template>
  <div class="products-page">
    <header class="products-header">
      <h1>{{ category ? `Categoría: ${category}` : 'Productos' }}</h1>
      <p v-if="total > 0" class="products-count">{{ total }} productos</p>
    </header>

    <div v-if="error" class="products-error">
      <p>No se pudieron cargar los productos.</p>
    </div>

    <div v-else-if="products.length === 0" class="products-empty">
      <p>No hay productos disponibles.</p>
    </div>

    <ul v-else class="products-grid">
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

    <!-- Pagination -->
    <nav v-if="totalPages > 1" class="products-pagination" aria-label="Paginación">
      <NuxtLink
        v-if="currentPage > 1"
        :to="{ query: { page: currentPage - 1, ...(category ? { category } : {}) } }"
        class="pagination-btn"
      >
        Anterior
      </NuxtLink>
      <span class="pagination-info">{{ currentPage }} / {{ totalPages }}</span>
      <NuxtLink
        v-if="currentPage < totalPages"
        :to="{ query: { page: currentPage + 1, ...(category ? { category } : {}) } }"
        class="pagination-btn"
      >
        Siguiente
      </NuxtLink>
    </nav>
  </div>
</template>

<style scoped>
.products-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.products-header {
  margin-bottom: 2rem;
}

.products-header h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
}

.products-count {
  color: #666;
  margin: 0;
}

.products-grid {
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

.products-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: 0 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  text-decoration: none;
  color: inherit;
  font-weight: 500;
  transition: background 0.15s;
}

.pagination-btn:hover {
  background: #f3f4f6;
}

.pagination-info {
  color: #666;
}

.products-error,
.products-empty {
  padding: 4rem 0;
  text-align: center;
  color: #666;
}
</style>
