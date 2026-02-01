<script setup lang="ts">
import { ref, watch, toRaw, onMounted, computed } from 'vue'
import type { Page, Block } from '@cms/contracts'
import BlockEditorModal from '../modals/BlockEditorModal.vue'

const previewFrame = ref<HTMLIFrameElement | null>(null)
const selectedBlockId = ref<string | null>(null)

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

onMounted(() => {
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'BLOCK_SELECT') {
      selectedBlockId.value = event.data.blockId
    }
  })
})

watch(
  page,
  (newPage) => {
    if (!previewFrame.value) return

    previewFrame.value.contentWindow?.postMessage(
      structuredClone(toRaw(newPage)),
      'http://localhost:3001'
    )
  },
  { deep: true }
)

const selectedBlock = computed<Block | null>(() => {
  return page.value.blocks.find(b => b.id === selectedBlockId.value) ?? null
})
</script>

<template>
  <button @click="addHero">Hero</button>
  <button @click="addText">Text</button>

  <iframe
    ref="previewFrame"
    src="http://localhost:3001"
    width="100%"
    height="400"
  />

  <BlockEditorModal :block="selectedBlock" />
</template>
