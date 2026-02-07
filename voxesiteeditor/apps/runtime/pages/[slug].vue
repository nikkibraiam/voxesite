<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { Page } from '@cms/contracts'
import { renderBlock } from '@cms/ui'
import { SelectableBlock } from '@cms/ui/wrappers'

const route = useRoute()
const slug = route.params.slug as string

const page = ref<Page | null>(null)
const isEditor = process.client && window !== window.parent

const { data } = await useAsyncData<Page>(
  `page-${slug}`,
  () => $fetch(`/api/page/${slug}`)
)

page.value = data.value ?? null

watch(page, (p) => {
  if (!p) return

  useHead({
    link: [
      {
        id: 'cms-page-styles',
        rel: 'stylesheet',
        href: `/cms/pages/${p.id}.css`
      }
    ]
  })
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
    page.value = event.data as Page
  })
})
</script>

<template>
  <template v-for="block in page?.blocks || []" :key="block.id">
    <SelectableBlock
      v-if="isEditor"
      :block-id="block.id"
      enabled
      @select="onBlockSelect"
    >
      <component :is="renderBlock(block)" v-bind="block.props" />
    </SelectableBlock>

    <component
      v-else
      :is="renderBlock(block)"
      v-bind="block.props"
    />
  </template>
</template>
