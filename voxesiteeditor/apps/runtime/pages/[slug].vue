<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { Page, Site, SiteLayout, UserPresence } from '@cms/contracts'
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

/** Full site document — needed to resolve Composite block definitions at render time. */
const site = ref<Site | null>(siteData ?? null)

const page = ref<Page | null>(
  siteData?.pages?.find((p: Page) => p.slug === slug) ?? null
)

const layout = ref<SiteLayout>(siteData?.layout ?? {})

// ─── CSP nonce ───────────────────────────────────────────────────────────────
// The nonce is generated per-request by server/middleware/csp.ts and stored on
// event.context.cspNonce.  useCspNonce() reads it on the server; on the client
// it falls back to the <meta name="csp-nonce"> tag injected below.
// It is applied to dynamically created <style> elements so they pass CSP checks.
const cspNonce = useCspNonce()

// Inject nonce into <meta name="csp-nonce"> so client-side code can read it
// after hydration (e.g. when regenerateStyles() runs in response to editor messages).
useHead({
  meta: cspNonce
    ? [{ name: 'csp-nonce', content: cspNonce }]
    : [],
})

// ─── Editor detection ────────────────────────────────────────────────────────
const isEditor = ref(false)

// ─── Presence — remote peers' awareness data ─────────────────────────────────
// blockId → peer info (only the first peer per block to keep it simple)
const peerMap = ref<Map<string, UserPresence>>(new Map())

/** Lookup helper used in the template for per-block peer prop. */
function peerForBlock(blockId: string): { color: string; displayName: string } | null {
  const peer = peerMap.value.get(blockId)
  return peer ? { color: peer.color, displayName: peer.displayName } : null
}

// ─── Dynamic CSS ─────────────────────────────────────────────────────────────
const dynamicStyleTag = ref<HTMLStyleElement | null>(null)

function generatePageCss(p: Page) {
  let css = ''
  for (const block of p.blocks) {
    css += generateBlockCss(block)
  }
  return css
}

function regenerateStyles(p: Page) {
  const css = generatePageCss(p)

  if (!dynamicStyleTag.value) {
    dynamicStyleTag.value = document.createElement('style')
    // Attach the CSP nonce so the browser allows this dynamically injected style.
    // Client-side we read it from <meta name="csp-nonce"> via useCspNonce().
    const nonce = useCspNonce()
    if (nonce) {
      dynamicStyleTag.value.nonce = nonce
    }
    document.head.appendChild(dynamicStyleTag.value)
  }

  dynamicStyleTag.value.textContent = css
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
      // Keep site.pages in sync so composite definitions can be resolved during render
      if (site.value) {
        const idx = site.value.pages.findIndex(p => p.id === event.data.payload.id)
        if (idx !== -1) site.value.pages[idx] = event.data.payload
      }
      regenerateStyles(event.data.payload)
      styleVersion.value = Date.now()
    }

    if (event.data.type === 'LAYOUT_UPDATE') {
      layout.value = event.data.payload
    }

    if (event.data.type === 'AI_PATCH') {
      // Apply a full or partial page update from the AI editor.
      // Merges onto the current page so existing blocks are preserved if the
      // payload is a Partial<Page>.
      if (page.value && event.data.payload) {
        page.value = { ...page.value, ...event.data.payload } as Page
        regenerateStyles(page.value)
        styleVersion.value = Date.now()
      }
    }

    if (event.data.type === 'PRESENCE_UPDATE') {
      // Rebuild blockId → first-peer map from remote users' awareness state.
      // Only page-block selections are shown here (layout slot highlights are
      // handled via the editor sidebar, not the runtime).
      const newMap = new Map<string, UserPresence>()
      for (const user of event.data.payload) {
        if (user.selectedBlockId && !newMap.has(user.selectedBlockId)) {
          newMap.set(user.selectedBlockId, user)
        }
      }
      peerMap.value = newMap
    }

    if (event.data.type === 'AI_VOICE_RESPONSE') {
      // The editor has finished an AI response and is signalling the native layer to speak it.
      // The runtime forwards this message to its parent (the native WebView container).
      // No audio playback happens in the web layer.
      //
      // TODO: Android → use TextToSpeech API. iOS → use AVSpeechSynthesizer.
      //       The native layer should listen for postMessage events of type AI_VOICE_RESPONSE
      //       on the WebView and invoke the system TTS with event.data.payload.text.
      console.log('[runtime] AI_VOICE_RESPONSE — forwarding to native layer:', event.data.payload.text)
      if (window.parent && window.parent !== window) {
        // Forward to the native app container sitting above the editor iframe stack
        window.parent.postMessage(event.data, '*')
      }
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
    <SelectableBlock
      v-if="isEditor"
      :block-id="block.id"
      enabled
      :peer="peerForBlock(block.id)"
      @select="onBlockSelect"
    >
      <component :is="renderBlock(block, { site: site ?? undefined })" v-bind="block.props" />
    </SelectableBlock>

    <component v-else :is="renderBlock(block, { site: site ?? undefined })" v-bind="block.props" />
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
