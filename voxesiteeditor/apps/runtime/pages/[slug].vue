<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { Page, SiteLayout } from '@cms/contracts'
import { isEditorMessage, sendEditorMessage } from '@cms/contracts'
import { renderBlock, renderLayoutBlock } from '@cms/ui'
import { SelectableBlock } from '@cms/ui/wrappers'
import { generateBlockCss } from '@cms/utils'

const EDITOR_ORIGIN = 'http://localhost:3000'

const route = useRoute()
const slug = route.params.slug as string

// ─── Data fetch ─────────────────────────────────────────────────────────────
// Fetch the full site so we have both the page content and the shared layout.
const { data, error } : any = await useFetch(
  `http://localhost:2999/api/demosite/site`
)

const siteData = data.value?.data

const page = ref<Page | null>(
  siteData?.pages?.find((p: Page) => p.slug === slug) ?? null
)

const layout = ref<SiteLayout>(siteData?.layout ?? {})

// ─── Editor detection ────────────────────────────────────────────────────────
const isEditor = ref(false)

// ─── Dynamic CSS ─────────────────────────────────────────────────────────────
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

// ─── Block selection (page blocks) ──────────────────────────────────────────
function onBlockSelect(blockId: string) {
  if (!isEditor.value) return
  sendEditorMessage(
    window.parent,
    { type: 'BLOCK_SELECT', payload: { blockId } },
    EDITOR_ORIGIN
  )
}

// ─── Layout block selection ──────────────────────────────────────────────────
function onLayoutBlockSelect(slot: 'header' | 'footer') {
  if (!isEditor.value) return
  sendEditorMessage(
    window.parent,
    { type: 'LAYOUT_BLOCK_SELECT', payload: { slot } },
    EDITOR_ORIGIN
  )
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────
onMounted(() => {
  isEditor.value = window !== window.parent

  if (!isEditor.value) return

  window.addEventListener('message', (event) => {
    if (event.origin !== EDITOR_ORIGIN) return
    if (!isEditorMessage(event.data)) return

    if (event.data.type === 'PAGE_UPDATE') {
      page.value = event.data.payload
      regenerateStyles(event.data.payload)
      styleVersion.value = Date.now()
    }

    if (event.data.type === 'LAYOUT_UPDATE') {
      layout.value = event.data.payload
    }
  })
})
</script>

<template>
  <!-- Header layout slot -->
  <SelectableBlock
    v-if="isEditor && layout.header"
    block-id="__header__"
    enabled
    @select="onLayoutBlockSelect('header')"
  >
    <component :is="renderLayoutBlock(layout.header)" v-bind="layout.header.props" />
  </SelectableBlock>
  <component
    v-else-if="layout.header"
    :is="renderLayoutBlock(layout.header)"
    v-bind="layout.header.props"
  />

  <!-- Page blocks -->
  <template v-for="block in page?.blocks || []" :key="block.id">
    <SelectableBlock v-if="isEditor" :block-id="block.id" enabled @select="onBlockSelect">
      <component :is="renderBlock(block)" v-bind="block.props" />
    </SelectableBlock>

    <component v-else :is="renderBlock(block)" v-bind="block.props" />
  </template>

  <!-- Footer layout slot -->
  <SelectableBlock
    v-if="isEditor && layout.footer"
    block-id="__footer__"
    enabled
    @select="onLayoutBlockSelect('footer')"
  >
    <component :is="renderLayoutBlock(layout.footer)" v-bind="layout.footer.props" />
  </SelectableBlock>
  <component
    v-else-if="layout.footer"
    :is="renderLayoutBlock(layout.footer)"
    v-bind="layout.footer.props"
  />
</template>
