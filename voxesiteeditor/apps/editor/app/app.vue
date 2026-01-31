<script setup lang="ts">
import type { Page } from '@cms/contracts'

const page = ref<Page>({
  id: 'home',
  slug: '/',
  blocks: []
})

function addHero() {
  page.value.blocks.push({
    id: crypto.randomUUID(),
    type: 'Hero',
    props: { title: 'Hero desde editor' }
  })
}

function addText() {
  page.value.blocks.push({
    id: crypto.randomUUID(),
    type: 'TextBlock',
    props: { text: 'Texto desde editor' }
  })
}

function sendToPreview() {
  window.frames[0]?.postMessage(page.value, '*')
}
</script>

<template>
  <button @click="addHero">Hero</button>
  <button @click="addText">Text</button>
  <button @click="sendToPreview">Preview</button>

  <iframe src="http://localhost:3001" width="100%" height="400" />
</template>
