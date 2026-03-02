<script setup lang="ts">
import { computed } from 'vue'
import type { MapEmbedProps } from '@cms/contracts'

const props = withDefaults(defineProps<MapEmbedProps>(), {
  address: '',
  zoom: 14,
  height: '400px',
  title: 'Mapa',
})

const embedUrl = computed(() => {
  if (!props.address) return ''
  const q = encodeURIComponent(props.address)
  const z = Number(props.zoom) || 14
  return `https://maps.google.com/maps?q=${q}&z=${z}&output=embed`
})
</script>

<template>
  <div class="map-embed" :style="{ height: height }">
    <iframe
      v-if="embedUrl"
      class="map-embed__iframe"
      :src="embedUrl"
      :title="title"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      allowfullscreen
      sandbox="allow-scripts allow-same-origin allow-popups"
    ></iframe>
    <div v-else class="map-embed__placeholder" aria-hidden="true">
      <span>📍 Sin dirección configurada</span>
    </div>
  </div>
</template>

<style scoped>
.map-embed {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  background: #f0f0f0;
  margin: 1.5rem;
}

.map-embed__iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.map-embed__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  opacity: 0.5;
}
</style>
