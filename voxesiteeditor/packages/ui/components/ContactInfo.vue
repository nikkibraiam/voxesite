<script setup lang="ts">
import type { ContactInfoProps } from '@cms/contracts'

withDefaults(defineProps<ContactInfoProps>(), {
  heading: 'Contáctanos',
  email: '',
  phone: '',
  address: '',
  mapUrl: ''
})
</script>

<template>
  <section class="contact-info">
    <div class="contact-info__inner">
      <div class="contact-info__details">
        <h2 v-if="heading" class="contact-info__heading">{{ heading }}</h2>

        <ul class="contact-info__list">
          <li v-if="email" class="contact-info__item">
            <span class="contact-info__icon" aria-hidden="true">✉</span>
            <a :href="`mailto:${email}`" class="contact-info__link">{{ email }}</a>
          </li>
          <li v-if="phone" class="contact-info__item">
            <span class="contact-info__icon" aria-hidden="true">📞</span>
            <a :href="`tel:${phone.replace(/\s/g, '')}`" class="contact-info__link">{{ phone }}</a>
          </li>
          <li v-if="address" class="contact-info__item">
            <span class="contact-info__icon" aria-hidden="true">📍</span>
            <span>{{ address }}</span>
          </li>
        </ul>
      </div>

      <!-- Map embed -->
      <div v-if="mapUrl" class="contact-info__map-wrap">
        <iframe
          :src="mapUrl"
          class="contact-info__map"
          width="100%"
          height="300"
          style="border: 0"
          allowfullscreen
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          title="Mapa de ubicación"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.contact-info {
  padding: 3rem 1.5rem;
}

.contact-info__inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  max-width: 1000px;
  margin: 0 auto;
  align-items: start;
}

.contact-info__heading {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 1.5rem;
}

.contact-info__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.contact-info__item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
}

.contact-info__icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  width: 28px;
  text-align: center;
  margin-top: 1px;
}

.contact-info__link {
  color: inherit;
  text-decoration: none;
}

.contact-info__link:hover {
  color: #5858c8;
  text-decoration: underline;
}

.contact-info__map-wrap {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.contact-info__map {
  display: block;
}

@media (max-width: 700px) {
  .contact-info__inner {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}
</style>
