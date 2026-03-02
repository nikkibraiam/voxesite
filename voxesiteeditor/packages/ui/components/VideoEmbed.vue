<script setup lang="ts">
import { computed } from 'vue'
import type { VideoEmbedProps } from '@cms/contracts'

const props = withDefaults(defineProps<VideoEmbedProps>(), {
  videoUrl: '',
  autoplay: false,
  muted: false,
  posterUrl: '',
  aspectRatio: '16:9'
})

function getEmbedUrl(url: string): string {
  if (!url) return ''
  // YouTube: watch?v=, youtu.be/, or /embed/
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) {
    const params = new URLSearchParams()
    if (props.autoplay) { params.set('autoplay', '1'); params.set('mute', '1') }
    if (props.muted) params.set('mute', '1')
    const qs = params.toString()
    return `https://www.youtube.com/embed/${ytMatch[1]}${qs ? '?' + qs : ''}`
  }
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeoMatch) {
    const params = new URLSearchParams()
    if (props.autoplay) { params.set('autoplay', '1'); params.set('muted', '1') }
    if (props.muted) params.set('muted', '1')
    const qs = params.toString()
    return `https://player.vimeo.com/video/${vimeoMatch[1]}${qs ? '?' + qs : ''}`
  }
  return url
}

const embedUrl = computed(() => getEmbedUrl(props.videoUrl ?? ''))

const ratioMap: Record<string, string> = { '16:9': '56.25%', '4:3': '75%', '1:1': '100%' }
const paddingBottom = computed(() => ratioMap[props.aspectRatio ?? '16:9'] ?? '56.25%')
</script>

<template>
  <div class="video-embed">
    <div class="video-embed__wrapper" :style="{ paddingBottom }">
      <iframe
        v-if="embedUrl"
        :src="embedUrl"
        class="video-embed__iframe"
        frameborder="0"
        allowfullscreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        title="Video embebido"
      />
      <div v-else class="video-embed__placeholder">
        <span>Sin URL de video</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.video-embed {
  width: 100%;
  max-width: 960px;
  margin: 2rem auto;
  padding: 0 1.5rem;
}

.video-embed__wrapper {
  position: relative;
  width: 100%;
  height: 0;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}

.video-embed__iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

.video-embed__placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a2e;
  color: #888;
  font-size: 0.9375rem;
}
</style>
