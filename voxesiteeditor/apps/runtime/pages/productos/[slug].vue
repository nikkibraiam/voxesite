<script setup lang="ts">
import type { Product } from '@cms/contracts'

// ISR is configured via routeRules in nuxt.config.ts — no SSR/ISR logic here.

const route = useRoute()
const slug = route.params.slug as string

// siteId from env (avoids hardcoding 'demosite' — multi-tenant ready)
const config = useRuntimeConfig()
const siteId = (config.public as any).siteId ?? 'demosite'

const { data: productData, error } = await useAsyncData(
  `product-${slug}`,
  () => $fetch<{ ok: boolean; product: Product }>(`/api/${siteId}/products/${slug}`)
)

const product = computed(() => productData.value?.product ?? null)

// ─── SEO meta tags ────────────────────────────────────────────────────────────
useSeoMeta({
  title: () => product.value?.seo?.title ?? product.value?.name ?? slug,
  description: () => product.value?.seo?.description ?? product.value?.description ?? '',
  ogImage: () => product.value?.seo?.ogImage ?? product.value?.images?.[0] ?? '',
  ogTitle: () => product.value?.seo?.title ?? product.value?.name ?? slug,
  ogDescription: () => product.value?.seo?.description ?? product.value?.description ?? '',
})

// ─── Schema.org Product JSON-LD ───────────────────────────────────────────────
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: computed(() => {
        if (!product.value) return '{}'
        return JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.value.name,
          description: product.value.description,
          image: product.value.images,
          sku: product.value.sku,
          offers: {
            '@type': 'Offer',
            price: product.value.price,
            priceCurrency: product.value.currency,
            availability:
              (product.value.stock ?? 1) > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
          },
        })
      }),
    },
  ],
})
</script>

<template>
  <div v-if="error" class="product-error">
    <p>Producto no encontrado.</p>
  </div>

  <div v-else-if="!product" class="product-loading">
    <p>Cargando...</p>
  </div>

  <article v-else class="product-detail">
    <!-- Images -->
    <div v-if="product.images?.length" class="product-images">
      <img
        :src="product.images[0]"
        :alt="product.name"
        class="product-image-main"
        loading="eager"
      />
      <div v-if="product.images.length > 1" class="product-image-thumbs">
        <img
          v-for="(img, i) in product.images.slice(1)"
          :key="i"
          :src="img"
          :alt="`${product.name} — imagen ${i + 2}`"
          class="product-image-thumb"
          loading="lazy"
        />
      </div>
    </div>

    <!-- Info -->
    <div class="product-info">
      <h1 class="product-name">{{ product.name }}</h1>

      <div class="product-pricing">
        <span class="product-price">{{ product.currency }} {{ product.price.toLocaleString() }}</span>
        <span v-if="product.originalPrice" class="product-original-price">
          {{ product.currency }} {{ product.originalPrice.toLocaleString() }}
        </span>
      </div>

      <p class="product-description">{{ product.description }}</p>

      <div v-if="product.attributes && Object.keys(product.attributes).length" class="product-attributes">
        <dl>
          <template v-for="(value, key) in product.attributes" :key="key">
            <dt>{{ key }}</dt>
            <dd>{{ value }}</dd>
          </template>
        </dl>
      </div>

      <div class="product-stock">
        <span v-if="(product.stock ?? 1) > 0" class="in-stock">En stock</span>
        <span v-else class="out-of-stock">Agotado</span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.product-detail {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

@media (min-width: 768px) {
  .product-detail {
    grid-template-columns: 1fr 1fr;
  }
}

.product-images {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.product-image-main {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 8px;
}

.product-image-thumbs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.product-image-thumb {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.product-name {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
}

.product-pricing {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.product-price {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111;
}

.product-original-price {
  font-size: 1rem;
  color: #999;
  text-decoration: line-through;
}

.product-description {
  color: #444;
  line-height: 1.6;
  margin: 0;
}

.product-attributes dl {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.25rem 1rem;
  margin: 0;
}

.product-attributes dt {
  font-weight: 600;
  text-transform: capitalize;
}

.product-attributes dd {
  margin: 0;
}

.in-stock {
  color: #16a34a;
  font-weight: 600;
}

.out-of-stock {
  color: #dc2626;
  font-weight: 600;
}

.product-error,
.product-loading {
  padding: 4rem 1rem;
  text-align: center;
  color: #666;
}
</style>
