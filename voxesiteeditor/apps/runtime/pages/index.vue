<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Page } from '@cms/contracts'
import { renderBlock } from '@cms/ui'
import { SelectableBlock } from '@cms/ui/wrappers'

const page = ref<Page | null>(null)
let isEditor: boolean = true;

// carga normal
const { data } = await useAsyncData<Page>('home', () => $fetch('/api/page/home'))
page.value = data.value || null

function onBlockSelect(blockId: string) {
  // 🔥 aquí lo capturas
  window.parent.postMessage(
    { type: 'BLOCK_SELECT', blockId },
    'http://localhost:3000'
  )
}

onMounted(() => {
  window.addEventListener('message', (event) => {
    if (event.origin !== 'http://localhost:3000') return
    page.value = event.data as Page
  })
})
</script>

<template>
  <SelectableBlock 
    v-if="isEditor"
    v-for="block in page?.blocks || []"
    :key="block.id"
    :block-id="block.id"
    enabled
    @select="onBlockSelect"
  >
    <component
      :is="renderBlock(block)"
      v-bind="block.props"
    />
  </SelectableBlock>
</template>
