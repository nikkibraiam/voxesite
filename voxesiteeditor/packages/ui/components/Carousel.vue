<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { CarouselProps, CarouselItem } from '@cms/contracts'

const props = withDefaults(defineProps<CarouselProps>(), {
  autoplay: false,
  interval: 4000,
  showArrows: true,
  showDots: true,
})

const parsedItems = computed<CarouselItem[]>(() => {
  if (!props.items) return []
  if (Array.isArray(props.items)) return props.items
  try { return JSON.parse(props.items as string) } catch { return [] }
})

const current = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function prev() {
  const len = parsedItems.value.length
  current.value = (current.value - 1 + len) % len
}

function next() {
  const len = parsedItems.value.length
  current.value = (current.value + 1) % len
}

function goTo(i: number) {
  current.value = i
}

function handleKey(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') prev()
  if (e.key === 'ArrowRight') next()
}

onMounted(() => {
  if (props.autoplay && parsedItems.value.length > 1) {
    timer = setInterval(next, Number(props.interval) || 4000)
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div
    class="carousel"
    role="region"
    aria-label="Carrusel de imágenes"
    tabindex="0"
    @keydown="handleKey"
  >
    <div class="carousel__track" :style="{ transform: `translateX(-${current * 100}%)` }">
      <div
        v-for="(item, i) in parsedItems"
        :key="i"
        class="carousel__slide"
        role="group"
        :aria-label="`Diapositiva ${i + 1} de ${parsedItems.length}`"
      >
        <img
          :src="item.imageUrl"
          :alt="item.alt ?? `Slide ${i + 1}`"
          class="carousel__img"
          loading="lazy"
        />
        <div v-if="item.caption" class="carousel__caption">{{ item.caption }}</div>
      </div>
    </div>

    <template v-if="showArrows && parsedItems.length > 1">
      <button
        class="carousel__arrow carousel__arrow--prev"
        type="button"
        aria-label="Anterior"
        @click="prev"
      >‹</button>
      <button
        class="carousel__arrow carousel__arrow--next"
        type="button"
        aria-label="Siguiente"
        @click="next"
      >›</button>
    </template>

    <div v-if="showDots && parsedItems.length > 1" class="carousel__dots" role="list">
      <button
        v-for="(_, i) in parsedItems"
        :key="i"
        class="carousel__dot"
        :class="{ 'carousel__dot--active': current === i }"
        type="button"
        :aria-label="`Ir a diapositiva ${i + 1}`"
        role="listitem"
        @click="goTo(i)"
      ></button>
    </div>
  </div>
</template>

<style scoped>
.carousel {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  outline: none;
  user-select: none;
  margin: 1.5rem;
}

.carousel:focus-visible {
  box-shadow: 0 0 0 3px rgba(88, 88, 200, 0.4);
}

.carousel__track {
  display: flex;
  transition: transform 0.4s ease;
  will-change: transform;
}

.carousel__slide {
  flex: 0 0 100%;
  position: relative;
}

.carousel__img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  display: block;
}

.carousel__caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem 1.5rem;
  background: linear-gradient(transparent, rgba(0,0,0,0.6));
  color: #fff;
  font-size: 0.9375rem;
}

.carousel__arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  transition: background 0.15s;
  line-height: 1;
}

.carousel__arrow:hover {
  background: #fff;
}

.carousel__arrow--prev { left: 0.75rem; }
.carousel__arrow--next { right: 0.75rem; }

.carousel__dots {
  position: absolute;
  bottom: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.5rem;
  z-index: 2;
}

.carousel__dot {
  width: 8px;
  height: 8px;
  min-width: 8px;
  min-height: 8px;
  padding: 6px;
  box-sizing: content-box;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.carousel__dot--active {
  background: #fff;
  transform: scale(1.3);
}
</style>
