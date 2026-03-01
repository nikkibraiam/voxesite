<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ImageGalleryProps, GalleryImage } from '@cms/contracts'

const props = withDefaults(defineProps<ImageGalleryProps>(), {
  heading: '',
  layout: 'grid',
  columns: 3
})

const parsedImages = computed<GalleryImage[]>(() => {
  if (!props.images) return []
  if (Array.isArray(props.images)) return props.images
  try { return JSON.parse(props.images as string) } catch { return [] }
})

const lightboxIndex = ref<number | null>(null)

function openLightbox(i: number) {
  lightboxIndex.value = i
}

function closeLightbox() {
  lightboxIndex.value = null
}

function prevImage() {
  if (lightboxIndex.value === null) return
  lightboxIndex.value = (lightboxIndex.value - 1 + parsedImages.value.length) % parsedImages.value.length
}

function nextImage() {
  if (lightboxIndex.value === null) return
  lightboxIndex.value = (lightboxIndex.value + 1) % parsedImages.value.length
}

const gridStyle = computed(() => ({
  '--gallery-columns': String(props.columns ?? 3)
}))

const currentImage = computed(() =>
  lightboxIndex.value !== null ? parsedImages.value[lightboxIndex.value] : null
)
</script>

<template>
  <section class="image-gallery">
    <div v-if="heading" class="image-gallery__heading-wrap">
      <h2 class="image-gallery__heading">{{ heading }}</h2>
    </div>

    <div
      class="image-gallery__grid"
      :class="`image-gallery__grid--${layout}`"
      :style="gridStyle"
    >
      <button
        v-for="(img, i) in parsedImages"
        :key="i"
        class="image-gallery__item"
        :aria-label="`Ver imagen ${i + 1}`"
        @click="openLightbox(i)"
      >
        <img
          :src="img.url"
          :alt="img.alt ?? `Imagen ${i + 1}`"
          class="image-gallery__img"
          loading="lazy"
        />
      </button>
    </div>

    <!-- Lightbox -->
    <Teleport to="body">
      <div
        v-if="lightboxIndex !== null"
        class="image-gallery__lightbox"
        role="dialog"
        aria-modal="true"
        @click.self="closeLightbox"
        @keydown.esc="closeLightbox"
        @keydown.left="prevImage"
        @keydown.right="nextImage"
      >
        <button class="image-gallery__lb-close" aria-label="Cerrar" @click="closeLightbox">✕</button>
        <button class="image-gallery__lb-prev" aria-label="Anterior" @click="prevImage">‹</button>
        <img
          v-if="currentImage"
          :src="currentImage.url"
          :alt="currentImage.alt ?? ''"
          class="image-gallery__lb-img"
        />
        <button class="image-gallery__lb-next" aria-label="Siguiente" @click="nextImage">›</button>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.image-gallery {
  padding: 3rem 1.5rem;
}

.image-gallery__heading-wrap {
  text-align: center;
  margin-bottom: 2rem;
}

.image-gallery__heading {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

/* Grid layout */
.image-gallery__grid--grid {
  display: grid;
  grid-template-columns: repeat(var(--gallery-columns, 3), 1fr);
  gap: 0.75rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* Masonry layout (CSS columns) */
.image-gallery__grid--masonry {
  columns: var(--gallery-columns, 3);
  column-gap: 0.75rem;
  max-width: 1200px;
  margin: 0 auto;
}

.image-gallery__grid--masonry .image-gallery__item {
  break-inside: avoid;
  margin-bottom: 0.75rem;
  display: block;
  width: 100%;
}

.image-gallery__item {
  border: none;
  padding: 0;
  background: none;
  cursor: pointer;
  border-radius: 6px;
  overflow: hidden;
  display: block;
}

.image-gallery__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.2s;
}

.image-gallery__item:hover .image-gallery__img {
  transform: scale(1.03);
}

/* Lightbox */
.image-gallery__lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.image-gallery__lb-img {
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 4px;
}

.image-gallery__lb-close,
.image-gallery__lb-prev,
.image-gallery__lb-next {
  position: absolute;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.image-gallery__lb-close { top: 1rem; right: 1rem; }
.image-gallery__lb-prev  { left: 1rem; }
.image-gallery__lb-next  { right: 1rem; }

.image-gallery__lb-close:hover,
.image-gallery__lb-prev:hover,
.image-gallery__lb-next:hover {
  background: rgba(255, 255, 255, 0.3);
}

@media (max-width: 768px) {
  .image-gallery__grid--grid,
  .image-gallery__grid--masonry {
    grid-template-columns: repeat(2, 1fr);
    columns: 2;
  }
}

@media (max-width: 480px) {
  .image-gallery__grid--grid,
  .image-gallery__grid--masonry {
    grid-template-columns: 1fr;
    columns: 1;
  }
}
</style>
