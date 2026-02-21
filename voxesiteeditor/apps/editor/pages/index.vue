<script setup lang="ts">
import { ref, watch, toRaw, onMounted, computed } from 'vue'
import type { Page, BaseBlock } from '@cms/contracts'
import { BlockSchemas } from '@cms/ui/schemas'
import BlockEditorModal from '../modals/BlockEditorModal.vue'


const previewFrame = ref<HTMLIFrameElement | null>(null)
const selectedBlockId = ref<string | null>(null)

const page = ref<Page>({
  id: '2a8dda0d-be2d-4e13-b6f8-effaf1058def',
  slug: 'home',
  blocks: []
})

function addBlock(type: string) {
  const schema = BlockSchemas[type]
  page.value.blocks.push({
    id: crypto.randomUUID(),
    type,
    props: { ...schema.content.defaultProps }
  })
}

async function applyBlockChanges(updated: BaseBlock<string, any>) {
  const index = page.value.blocks.findIndex(
    b => b.id === updated.id
  )

  if (index !== -1) {
    page.value.blocks[index] = updated
  }

  await $fetch('/api/save', {
    method: 'POST',
    body: toRaw(page.value)
  })

  // avisamos al runtime que recargue estilos
  previewFrame.value?.contentWindow?.postMessage(
    { type: 'PAGE_SAVED', page: structuredClone(toRaw(page.value)) },
    'http://localhost:3001'
  )
}

async function savePage() {
  await $fetch('/api/save', {
    method: 'POST',
    body: toRaw(page.value)
  })

  // 🔥 avisamos al runtime que recargue estilos
  previewFrame.value?.contentWindow?.postMessage(
    { type: 'PAGE_SAVED', page: structuredClone(toRaw(page.value)) },
    'http://localhost:3001'
  )

  alert('Página guardada 🚀')
}

async function publishSite(siteId: string) {
  if (!siteId) {
    alert('No hay siteId definido')
    return
  }

  await $fetch(`http://localhost:2999/api/${siteId}/build`, {
    method: 'POST'
  })
  alert(`Sitio publicado: ${siteId}`)
}


onMounted(async () => {
  try {
    const result: any = await $fetch('/api/page')
    if (result?.data) {
      page.value = result.data
    }
  } catch {
    // página aún no existe en el servidor, se usa la default vacía
  }

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
      { type: 'ADD_BLOCK', page: structuredClone(toRaw(newPage)) },
      'http://localhost:3001'
    )
  },
  { deep: true }
)

const selectedBlock = computed<BaseBlock<string, any> | null>(() => {
  return page.value.blocks.find(b => b.id === selectedBlockId.value) ?? null
})
</script>

<template>
  <button
    v-for="[type, schema] in Object.entries(BlockSchemas)"
    :key="type"
    @click="addBlock(type)"
  >{{ schema.content.label }}</button>

  <iframe ref="previewFrame" src="http://localhost:3001" width="100%" height="400" />
  <button @click="savePage">Guardar página</button>
  <button @click="publishSite('demosite')">Publicar</button>

  <BlockEditorModal :block="selectedBlock" @apply="applyBlockChanges" @close="selectedBlockId = null" />
</template>
