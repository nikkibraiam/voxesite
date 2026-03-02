<script setup lang="ts">
import type { ProductCardProps } from '@cms/contracts'

const props = withDefaults(defineProps<ProductCardProps>(), {
  currency: '$',
  ctaLabel: 'Comprar',
  name: '',
})
</script>

<template>
  <article class="product-card">
    <div class="product-card__img-wrap">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="name"
        class="product-card__img"
        loading="lazy"
      />
      <div v-else class="product-card__img-placeholder" aria-hidden="true">📦</div>
      <span v-if="badge" class="product-card__badge">{{ badge }}</span>
    </div>

    <div class="product-card__body">
      <h3 class="product-card__name">{{ name }}</h3>

      <div class="product-card__pricing">
        <span class="product-card__price">{{ currency }}{{ price?.toFixed(2) }}</span>
        <span v-if="originalPrice && originalPrice > (price ?? 0)" class="product-card__original">
          {{ currency }}{{ originalPrice.toFixed(2) }}
        </span>
      </div>

      <a
        v-if="ctaUrl"
        :href="ctaUrl"
        class="product-card__cta"
      >{{ ctaLabel }}</a>
      <button v-else class="product-card__cta" type="button">{{ ctaLabel }}</button>
    </div>
  </article>
</template>

<style scoped>
.product-card {
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.product-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.product-card__img-wrap {
  position: relative;
  aspect-ratio: 4 / 3;
  background: #f5f5f5;
  overflow: hidden;
}

.product-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s;
}

.product-card:hover .product-card__img {
  transform: scale(1.04);
}

.product-card__img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
}

.product-card__badge {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  background: #e53e3e;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.product-card__body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.product-card__name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.4;
}

.product-card__pricing {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.product-card__price {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a2e;
}

.product-card__original {
  font-size: 0.875rem;
  color: #999;
  text-decoration: line-through;
}

.product-card__cta {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1rem;
  min-height: 44px;
  background: #5858c8;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  margin-top: auto;
  transition: background 0.15s;
}

.product-card__cta:hover {
  background: #4646aa;
}
</style>
