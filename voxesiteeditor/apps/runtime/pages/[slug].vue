<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { Page } from '@cms/contracts'
import { isEditorMessage, sendEditorMessage } from '@cms/contracts'
import { renderBlock } from '@cms/ui'
import { SelectableBlock } from '@cms/ui/wrappers'
import { generateBlockCss } from '@cms/utils'

const EDITOR_ORIGIN = 'http://localhost:3000'

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
  if (!isEditor.value) return

  sendEditorMessage(
    window.parent,
    { type: 'BLOCK_SELECT', payload: { blockId } },
    EDITOR_ORIGIN
  )
}

onMounted(() => {
  isEditor.value = window !== window.parent

  if (!isEditor.value) return

  window.addEventListener('message', (event) => {
    if (event.origin !== EDITOR_ORIGIN) return
    if (!isEditorMessage(event.data)) return

    // PAGE_UPDATE covers both live preview syncs and post-save pushes.
    // Always regenerate styles so block CSS stays in sync.
    if (event.data.type === 'PAGE_UPDATE') {
      page.value = event.data.payload
      regenerateStyles(event.data.payload)
      styleVersion.value = Date.now()
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
