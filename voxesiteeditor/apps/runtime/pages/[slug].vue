<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { Page } from '@cms/contracts'
import { renderBlock } from '@cms/ui'
import { SelectableBlock } from '@cms/ui/wrappers'

const route = useRoute()
const slug = route.params.slug as string

const pages = import.meta.glob('/public/data/pages/*.json', {
  eager: true,
  import: 'default'
})

const page = ref<Page | null>(
  pages[`/public/data/pages/${slug}.json`] as Page || null
)
const isEditor = process.client && window !== window.parent



const styleVersion = ref(Date.now())

watch(page, () => {
  styleVersion.value = Date.now()
})

useHead({
  link: [
    {
      key: 'cms-page-styles',
      rel: 'stylesheet',
      href: computed(() =>
        page.value
          ? `/api/pages/${slug}/style?t=${styleVersion.value}`
          : ''
      )
    }
  ]
})

function onBlockSelect(blockId: string) {
  if (!isEditor) return

  window.parent.postMessage(
    { type: 'BLOCK_SELECT', blockId },
    'http://localhost:3000'
  )
}

onMounted(() => {
  if (!isEditor) return

  window.addEventListener('message', (event) => {
    if (event.origin !== 'http://localhost:3000') return

    if (event.data?.type === 'PAGE_SAVED') {
      styleVersion.value = Date.now()
      return
    }

    // preview en vivo (cuando cambia page sin guardar)
    page.value = event.data as Page
  })
})
</script>

<template>
  <template v-for="block in page?.blocks || []" :key="block.id">
    <SelectableBlock v-if="isEditor" :block-id="block.id" enabled @select="onBlockSelect">
      <component :is="renderBlock(block)" v-bind="block.props" />
    </SelectableBlock>

    <component v-else :is="renderBlock(block)" v-bind="block.props" />
  </template>
</template>
