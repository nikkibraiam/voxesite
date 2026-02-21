<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { Page } from '@cms/contracts'
import { renderBlock } from '@cms/ui'
import { SelectableBlock } from '@cms/ui/wrappers'
import { generateBlockCss } from '@cms/utils'

const route = useRoute()
const slug = route.params.slug as string

const { data, error } : any = await useFetch(
  `http://localhost:2999/api/demosite/page/${slug}`
)

const page = ref<Page | null>(data.value?.data)
  
const isEditor = ref(false)

const dynamicStyleTag = ref<HTMLStyleElement | null>(null)

function generatePageCss(page: Page) {
  let css = ''

  for (const block of page.blocks) {
    css += generateBlockCss(block)
  }

  return css
}

function regenerateStyles(page: Page) {
  const css = generatePageCss(page)

  if (!dynamicStyleTag.value) {
    dynamicStyleTag.value = document.createElement('style')
    document.head.appendChild(dynamicStyleTag.value)
  }

  dynamicStyleTag.value.innerHTML = css
}

const styleVersion = ref(Date.now())

watch(page, () => {
  styleVersion.value = Date.now()
})

const isDev = process.dev

useHead({
  link: [
    {
      rel: 'stylesheet',
      href: isDev
        ? `/api/pages/${slug}/style?t=${styleVersion.value}`
        : `/generated-css/${slug}.css`
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
  isEditor.value = window !== window.parent

  if (!isEditor.value) return

  window.addEventListener('message', (event) => {
    if (event.origin !== 'http://localhost:3000') return

    if (event.data?.type === 'PAGE_SAVED') {
      page.value = event.data.page
      regenerateStyles(event.data.page)
      styleVersion.value = Date.now()
      return
    }
    if (event.data?.type == 'ADD_BLOCK'){
      page.value = event.data.page
    }
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
