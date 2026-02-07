<script setup lang="ts">
import { ref, watch, toRaw, onMounted, computed } from 'vue'
import type { Page, BaseBlock } from '@cms/contracts'
import BlockEditorModal from '../modals/BlockEditorModal.vue'
import { generateBlockCss } from '@cms/utils'


const previewFrame = ref<HTMLIFrameElement | null>(null)
const selectedBlockId = ref<string | null>(null)

const page = ref<Page>({
  id: 'home',
  slug: '/',
  blocks: []
})

function generatePageCss(page: Page) {
  let css = ''

  for (const block of page.blocks) {
    css += generateBlockCss(block)
  }

  return css
}


function savePageCss(page: Page) {
  const css = generatePageCss(page)

  const styleId = 'cms-inline-styles'
  let style = document.getElementById(styleId) as HTMLStyleElement

  if (!style) {
    style = document.createElement('style')
    style.id = styleId
    document.head.appendChild(style)
  }

  style.innerHTML = css
}

function reloadPageCss(slug: string) {
  let link = document.getElementById('cms-page-styles') as HTMLLinkElement

  if (!link) {
    link = document.createElement('link')
    link.id = 'cms-page-styles'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }

  link.href = `/cms/pages/${slug}.css?t=${Date.now()}`
}

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

function applyBlockChanges(updated: BaseBlock) {
  const index = page.value.blocks.findIndex(
    b => b.id === updated.id
  )

  if (index !== -1) {
    page.value.blocks[index] = updated
  }

  savePageCss(page.value)
  reloadPageCss(page.value.id)
}

async function savePage() {
  await $fetch('/api/page', {
    method: 'POST',
    body: toRaw(page.value)
  })

  alert('Página guardada 🚀')
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
    previewFrame.value?.contentWindow?.postMessage(
      structuredClone(toRaw(newPage)),
      'http://localhost:3001'
    )
  },
  { deep: true }
)

const selectedBlock = computed<BaseBlock | null>(() => {
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
  <button @click="savePage">Guardar página</button>

  <BlockEditorModal
  :block="selectedBlock"
  @apply="applyBlockChanges"
  @close="selectedBlockId = null"
/>
</template>
