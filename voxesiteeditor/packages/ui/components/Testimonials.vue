<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TestimonialsProps, Testimonial } from '@cms/contracts'

const props = withDefaults(defineProps<TestimonialsProps>(), {
  heading: '',
  layout: 'grid'
})

const parsedTestimonials = computed<Testimonial[]>(() => {
  if (!props.testimonials) return []
  if (Array.isArray(props.testimonials)) return props.testimonials
  try { return JSON.parse(props.testimonials as string) } catch { return [] }
})

// Carousel state
const activeIndex = ref(0)

function prev() {
  activeIndex.value = (activeIndex.value - 1 + parsedTestimonials.value.length) % parsedTestimonials.value.length
}

function next() {
  activeIndex.value = (activeIndex.value + 1) % parsedTestimonials.value.length
}

function starsArray(rating: number | undefined) {
  return Array.from({ length: 5 }, (_, i) => i < (rating ?? 5))
}
</script>

<template>
  <section class="testimonials">
    <div v-if="heading" class="testimonials__heading-wrap">
      <h2 class="testimonials__heading">{{ heading }}</h2>
    </div>

    <!-- Grid layout -->
    <div v-if="layout !== 'carousel'" class="testimonials__grid">
      <article
        v-for="(t, i) in parsedTestimonials"
        :key="i"
        class="testimonials__card"
      >
        <div class="testimonials__stars" aria-label="`${t.rating ?? 5} estrellas`">
          <span
            v-for="(filled, s) in starsArray(t.rating)"
            :key="s"
            :class="['testimonials__star', { 'testimonials__star--filled': filled }]"
          >★</span>
        </div>
        <p class="testimonials__text">"{{ t.text }}"</p>
        <div class="testimonials__author">
          <img
            v-if="t.avatarUrl"
            :src="t.avatarUrl"
            :alt="t.author"
            class="testimonials__avatar"
          />
          <span class="testimonials__author-name">{{ t.author }}</span>
        </div>
      </article>
    </div>

    <!-- Carousel layout -->
    <div v-else class="testimonials__carousel">
      <div class="testimonials__carousel-track" :style="{ transform: `translateX(-${activeIndex * 100}%)` }">
        <article
          v-for="(t, i) in parsedTestimonials"
          :key="i"
          class="testimonials__card testimonials__card--carousel"
        >
          <div class="testimonials__stars">
            <span
              v-for="(filled, s) in starsArray(t.rating)"
              :key="s"
              :class="['testimonials__star', { 'testimonials__star--filled': filled }]"
            >★</span>
          </div>
          <p class="testimonials__text">"{{ t.text }}"</p>
          <div class="testimonials__author">
            <img
              v-if="t.avatarUrl"
              :src="t.avatarUrl"
              :alt="t.author"
              class="testimonials__avatar"
            />
            <span class="testimonials__author-name">{{ t.author }}</span>
          </div>
        </article>
      </div>

      <div class="testimonials__carousel-controls">
        <button
          class="testimonials__carousel-btn"
          aria-label="Anterior"
          @click="prev"
        >‹</button>
        <div class="testimonials__dots">
          <button
            v-for="(_, i) in parsedTestimonials"
            :key="i"
            :class="['testimonials__dot', { 'testimonials__dot--active': i === activeIndex }]"
            :aria-label="`Ir a testimonio ${i + 1}`"
            @click="activeIndex = i"
          />
        </div>
        <button
          class="testimonials__carousel-btn"
          aria-label="Siguiente"
          @click="next"
        >›</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.testimonials {
  padding: 3rem 1.5rem;
}

.testimonials__heading-wrap {
  text-align: center;
  margin-bottom: 2rem;
}

.testimonials__heading {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

/* Grid */
.testimonials__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
}

.testimonials__card {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.testimonials__stars {
  display: flex;
  gap: 2px;
}

.testimonials__star {
  font-size: 1.125rem;
  color: #ddd;
}

.testimonials__star--filled {
  color: #f59e0b;
}

.testimonials__text {
  font-size: 0.9375rem;
  line-height: 1.6;
  margin: 0;
  flex: 1;
  font-style: italic;
  opacity: 0.85;
}

.testimonials__author {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.testimonials__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.testimonials__author-name {
  font-weight: 600;
  font-size: 0.9375rem;
}

/* Carousel */
.testimonials__carousel {
  max-width: 700px;
  margin: 0 auto;
  overflow: hidden;
}

.testimonials__carousel-track {
  display: flex;
  transition: transform 0.3s ease;
}

.testimonials__card--carousel {
  flex: 0 0 100%;
  border: none;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
}

.testimonials__carousel-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.testimonials__carousel-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid #ccc;
  background: #fff;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.testimonials__carousel-btn:hover {
  background: #f5f5f5;
}

.testimonials__dots {
  display: flex;
  gap: 6px;
}

.testimonials__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: #ccc;
  cursor: pointer;
  padding: 0;
  transition: background 0.15s;
}

.testimonials__dot--active {
  background: #1a1a2e;
}

@media (max-width: 600px) {
  .testimonials__grid {
    grid-template-columns: 1fr;
  }
}
</style>
