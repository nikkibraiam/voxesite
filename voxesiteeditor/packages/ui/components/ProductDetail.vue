<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ProductDetailProps, ProductSpec, ProductImage } from '@cms/contracts'

const props = withDefaults(defineProps<ProductDetailProps>(), {
  currency: '$',
  ctaLabel: 'Agregar al carrito',
})

const parsedImages = computed<ProductImage[]>(() => {
  if (!props.images) return []
  if (Array.isArray(props.images)) return props.images
  try { return JSON.parse(props.images as string) } catch { return [] }
})

const parsedSpecs = computed<ProductSpec[]>(() => {
  if (!props.specs) return []
  if (Array.isArray(props.specs)) return props.specs
  try { return JSON.parse(props.specs as string) } catch { return [] }
})

const activeImg = ref(0)
</script>

<template>
  <section class="product-detail">
    <div class="product-detail__layout">
      <!-- Gallery -->
      <div class="product-detail__gallery">
        <div class="product-detail__main-img-wrap">
          <img
            v-if="parsedImages.length"
            :src="parsedImages[activeImg]?.url"
            :alt="parsedImages[activeImg]?.alt ?? name"
            class="product-detail__main-img"
          />
          <div v-else class="product-detail__img-placeholder" aria-hidden="true">📦</div>
        </div>
        <div v-if="parsedImages.length > 1" class="product-detail__thumbs">
          <button
            v-for="(img, i) in parsedImages"
            :key="i"
            class="product-detail__thumb"
            :class="{ 'product-detail__thumb--active': activeImg === i }"
            type="button"
            :aria-label="`Ver imagen ${i + 1}`"
            @click="activeImg = i"
          >
            <img :src="img.url" :alt="img.alt ?? `Imagen ${i + 1}`" loading="lazy" />
          </button>
        </div>
      </div>

      <!-- Info -->
      <div class="product-detail__info">
        <h1 class="product-detail__name">{{ name }}</h1>

        <div class="product-detail__pricing">
          <span class="product-detail__price">{{ currency }}{{ price?.toFixed(2) }}</span>
          <span v-if="originalPrice && originalPrice > (price ?? 0)" class="product-detail__original">
            {{ currency }}{{ originalPrice.toFixed(2) }}
          </span>
        </div>

        <p v-if="description" class="product-detail__desc">{{ description }}</p>

        <a
          v-if="ctaUrl"
          :href="ctaUrl"
          class="product-detail__cta"
        >{{ ctaLabel }}</a>
        <button v-else class="product-detail__cta" type="button">{{ ctaLabel }}</button>

        <table v-if="parsedSpecs.length" class="product-detail__specs">
          <tbody>
            <tr v-for="(spec, i) in parsedSpecs" :key="i">
              <th class="product-detail__spec-label">{{ spec.label }}</th>
              <td class="product-detail__spec-value">{{ spec.value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<style scoped>
.product-detail {
  padding: 3rem 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
}

.product-detail__layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: start;
}

.product-detail__main-img-wrap {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
}

.product-detail__main-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.product-detail__img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
}

.product-detail__thumbs {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}

.product-detail__thumb {
  width: 60px;
  height: 60px;
  border: 2px solid transparent;
  border-radius: 6px;
  overflow: hidden;
  padding: 0;
  cursor: pointer;
  transition: border-color 0.15s;
  background: #f5f5f5;
}

.product-detail__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.product-detail__thumb--active {
  border-color: #5858c8;
}

.product-detail__name {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 1rem;
}

.product-detail__pricing {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.product-detail__price {
  font-size: 2rem;
  font-weight: 700;
}

.product-detail__original {
  font-size: 1.125rem;
  color: #999;
  text-decoration: line-through;
}

.product-detail__desc {
  font-size: 1rem;
  line-height: 1.7;
  opacity: 0.75;
  margin: 0 0 1.5rem;
}

.product-detail__cta {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.875rem 1.5rem;
  min-height: 44px;
  background: #5858c8;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  margin-bottom: 1.5rem;
  transition: background 0.15s;
}

.product-detail__cta:hover {
  background: #4646aa;
}

.product-detail__specs {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9375rem;
}

.product-detail__spec-label {
  text-align: left;
  font-weight: 500;
  padding: 0.5rem 0.75rem 0.5rem 0;
  border-bottom: 1px solid rgba(0,0,0,0.08);
  width: 40%;
  opacity: 0.65;
}

.product-detail__spec-value {
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(0,0,0,0.08);
}

@media (max-width: 768px) {
  .product-detail__layout { grid-template-columns: 1fr; }
}
</style>
