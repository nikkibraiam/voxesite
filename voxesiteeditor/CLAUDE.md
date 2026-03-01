# voxesiteeditor — Project Brief for Claude Code

## What is this project?
A SaaS CMS platform where users build and manage complete multi-page websites through a JSON-based block architecture. The editor supports visual editing (drag & drop), AI-powered editing via natural language prompts, voice input, and page generation from URLs or screenshots. The platform targets web, desktop (Electron/Tauri), and mobile (iOS & Android) via WebView embedding.

---

## Monorepo Structure

```
voxesiteeditor/
├── apps/
│   ├── editor/          # CMS editor UI (Nuxt 4, CSR, port 3000)
│   └── runtime/         # Live preview + SSR renderer (Nuxt 4, SSR, port 3001)
├── packages/
│   ├── contracts/       # Shared TypeScript interfaces (Page, BaseBlock, EditorMessage)
│   ├── ui/              # Vue components, renderer, schemas
│   └── utils/           # CSS generation utilities
└── node-build-server/   # Express backend (port 2999) — persistence, builds
```

### Key files
| File | Role |
|---|---|
| `packages/contracts/page.ts` | ✅ Core types: `Page`, `BaseBlock`, `Site`, `SiteLayout`, `SiteVersion`, `LayoutBlock`, `GridDefinition` |
| `packages/contracts/blocks/header.ts` | ✅ `HeaderProps`, `HeaderNavLink`, `HeaderBlock` — layout header types |
| `packages/contracts/blocks/footer.ts` | ✅ `FooterProps`, `FooterColumn`, `FooterLink`, `FooterBlock` — layout footer types |
| `packages/contracts/messages.ts` | ✅ Typed postMessage protocol: `EditorMessage`, `sendEditorMessage`, `isEditorMessage` |
| `packages/ui/renderer/renderComponent.ts` | ✅ Maps JSON blocks → Vue components via `h()`; exports `renderBlock`, `renderLayoutBlock`, `renderLayoutHeader`, `renderLayoutFooter` |
| `packages/ui/schemas/index.ts` | ✅ `BlockSchemas` (Hero, TextBlock) + `LayoutSchemas` (LayoutHeader, LayoutFooter) registries |
| `packages/ui/schemas/blocks/` | Block schemas for page blocks (hero, text) |
| `packages/ui/schemas/layout/` | ✅ Layout block schemas: `header.schema.ts`, `footer.schema.ts` |
| `packages/ui/components/LayoutHeader.vue` | ✅ Responsive header — logo, nav links, mobile hamburger menu |
| `packages/ui/components/LayoutFooter.vue` | ✅ Responsive footer — column groups, copyright, auto text-contrast |
| `packages/ui/wrappers/SelectableBlock.vue` | ✅ Click selection wrapper + drag handle (6-dot SVG, 44×44 px touch target, `touch-action:none`) |
| `packages/utils/css/generateBlockCss.ts` | Generates scoped CSS from block styles |
| `apps/editor/stores/usePageStore.ts` | ✅ Pinia store — page state + layout state + dual undo/redo stacks |
| `apps/editor/composables/usePageEditor.ts` | ✅ Load/save full Site, semver publish, iframe sync (page + layout), message listener |
| `apps/editor/composables/useLayoutEditor.ts` | ✅ Layout tab mode — `isLayoutMode`, `activateLayoutMode`, `activatePage`, `addOrSelectHeader/Footer` |
| `apps/editor/composables/useBlockSelection.ts` | ✅ Block selection wrapper |
| `apps/editor/composables/useDragDrop.ts` | ✅ Drag & drop — `draggableBlocks` computed (get/set), `sortableOptions` for vue-draggable-plus |
| `apps/editor/pages/index.vue` | ✅ Thin component — Layout tab + page tabs + `+ Página` button + draggable block list + iframe |
| `apps/editor/server/api/site.get.ts` | ✅ `GET /api/site` — proxies to build server, triggers migration on first load |
| `apps/editor/server/api/save.post.ts` | ✅ `POST /api/save` — accepts full `Site`, generates per-page CSS |
| `apps/editor/server/api/ai-prompt.post.ts` | ✅ `POST /api/ai-prompt` — thin proxy to build server AI route; serializes schema context from `@cms/ui`; SSE streaming passthrough |
| `apps/editor/components/BlockEditorPanel.vue` | ✅ Right-side sliding panel editor — Tweakpane inspector, handles page + layout blocks |
| `apps/editor/components/AiPromptPanel.vue` | ✅ Bottom sliding AI panel — prompt textarea, streamed output, error state, Ctrl+Enter submit |
| `apps/editor/composables/useBlockEditorPanel.ts` | ✅ Panel open/close state — auto-opens on block/layout selection |
| `apps/editor/composables/useAiEditor.ts` | ✅ AI panel state + streaming fetch + undo snapshot + `AI_PATCH` postMessage |
| `apps/runtime/pages/[slug].vue` | ✅ Renders header + page blocks + footer from site JSON, uses typed messages |
| `node-build-server/src/readSiteFull.ts` | ✅ Read `site.json`; auto-migrates from `data/pages/*.json` on first access |
| `node-build-server/src/saveSiteFull.ts` | ✅ Write `site.json` + explode per-page files + CSS |
| `node-build-server/src/versionManager.ts` | ✅ `saveVersion`, `listVersions`, `rollbackVersion` |
| `node-build-server/src/server.ts` | ✅ Express routes — includes Site CRUD, versions, rollback, AI prompt |
| `node-build-server/src/llm/types.ts` | ✅ `LLMMessage` (with optional `image` field), `LLMImageInput`, `LLMAdapter` interface |
| `node-build-server/src/llm/openaiAdapter.ts` | ✅ OpenAI-compatible adapter (OpenAI + Ollama) — supports multimodal image messages |
| `node-build-server/src/llm/anthropicAdapter.ts` | ✅ Anthropic Messages API adapter — supports multimodal image messages |
| `node-build-server/src/llm/factory.ts` | ✅ `createLLMAdapter()` + `isVisionCapable()` — reads `LLM_PROVIDER` env var |
| `node-build-server/src/transcription/whisperAdapter.ts` | ✅ `TranscriptionAdapter` interface, `WhisperAdapter` (POST /asr multipart), `MockWhisperAdapter` (dev fallback), `createTranscriptionAdapter()` factory |
| `node-build-server/src/pageGenerator/urlFetcher.ts` | ✅ Puppeteer screenshot + DOM text extraction from a URL |
| `node-build-server/src/pageGenerator/screenshotHandler.ts` | ✅ Base64/data-URI image validation + normalisation |
| `node-build-server/src/pageGenerator/htmlSanitizer.ts` | ✅ Server-side DOMPurify sanitisation + DOM text outline |
| `node-build-server/src/pageGenerator/pageGeneratorService.ts` | ✅ Orchestrates LLM call — system prompt with schema context, JSON extraction, one-retry logic |
| `node-build-server/src/__tests__/pageGenerator.test.ts` | ✅ Unit tests (node:test) — JSON parsing, markdown fence stripping, sanitiser, screenshot handler |
| `apps/editor/server/api/generate-url.post.ts` | ✅ `POST /api/generate-url` — proxy to build server, injects schema context, SSE streaming |
| `apps/editor/server/api/generate-screenshot.post.ts` | ✅ `POST /api/generate-screenshot` — proxy with vision-model error forwarding |
| `apps/editor/server/api/generate-html.post.ts` | ✅ `POST /api/generate-html` — proxy, no vision required |
| `apps/editor/composables/usePageGenerator.ts` | ✅ Three-flow generation composable — `isModalOpen`, `generateFromUrl/Screenshot/Html`, slug deduplication |
| `apps/editor/components/GeneratePageModal.vue` | ✅ Three-tab modal (URL / Captura / HTML) with loading, streaming output, error display |
| `apps/editor/composables/useVoiceInput.ts` | ✅ WebSocket manager for voice transcription — listens for `VOICE_INPUT` postMessages from native, forwards audio to WS, streams `liveTranscript`, populates `aiPrompt` on `TRANSCRIPT_DONE` |

---

## Data Model (✅ Implemented)

```ts
type BaseBlock<TType, TProps> = {
  id: string
  type: TType           // "Hero" | "TextBlock" | "LayoutHeader" | "LayoutFooter"
  props: TProps
  styles?: BlockStyles  // { ".hero__title": { color: "#fff" } }
  customCss?: string
}

interface Page {
  id: string
  slug: string          // e.g. "home" | "about"
  title?: string        // short label for editor tabs (optional, backward-compat)
  seo?: { title: string; description?: string }
  blocks: BaseBlock<string, any>[]
  cssFile?: string
}

interface Site {
  id: string
  version: string       // semver — bumped on every publish
  pages: Page[]
  layout: SiteLayout    // shared layout slots (header/footer/grids)
  publishedAt?: string  // ISO 8601 — set on publish
}

interface SiteLayout {
  header?: LayoutBlock  // LayoutHeader block — rendered above every page
  footer?: LayoutBlock  // LayoutFooter block — rendered below every page
  grids?: GridDefinition[]
}

// Layout block prop shapes (packages/contracts/blocks/)
interface HeaderProps {
  logoText?: string; logoImageUrl?: string; logoAlt?: string
  navLinks?: HeaderNavLink[]  // [{ label, href }]
  backgroundColor?: string; sticky?: boolean
}

interface FooterProps {
  columns?: FooterColumn[]    // [{ title, links: [{ label, href }] }]
  copyrightText?: string; backgroundColor?: string
}

interface SiteVersion {
  version: string       // semver e.g. "1.2.0"
  publishedAt: string   // ISO 8601 string
}
```

**Key decisions:**
- `Site` is the persistence unit — all saves and publishes operate on the full site
- Publishing bumps the semver patch, sets `publishedAt`, saves, then triggers Nuxt build
- Each publish creates a versioned snapshot in `runtime_storage/{siteId}/versions/{version}/site.json`
- `Page.title` is optional for backward compat — existing JSON without it still parses
- CSS is scoped per block using `.block-{id}` prefix; generated per page on every save
- Layout block props use **flat keys** (e.g. `logoText`, not `logo.text`) for simple form binding
- `navLinks` and `columns` are edited as **JSON** in the editor form (type `'json'`); the components accept both arrays and JSON strings at runtime

---

## Editor ↔ Runtime Communication (✅ Typed)

All postMessage communication uses `sendEditorMessage()` from `@cms/contracts`. Never use raw `postMessage`.

```ts
type EditorMessage =
  // Editor → Runtime
  | { type: 'PAGE_UPDATE'; payload: Page }
  | { type: 'LAYOUT_UPDATE'; payload: SiteLayout }    // live layout preview
  | { type: 'AI_PATCH'; payload: Partial<Page> }
  // Runtime → Editor
  | { type: 'BLOCK_SELECT'; payload: { blockId: string | null } }
  | { type: 'LAYOUT_BLOCK_SELECT'; payload: { slot: 'header' | 'footer' | null } }
  // Future
  | { type: 'VOICE_INPUT'; payload: { audio: Blob } }
  | { type: 'VOICE_TRANSCRIPT'; payload: { text: string } }
  | { type: 'AI_VOICE_RESPONSE'; payload: { text: string; audio?: Blob } }
```

**Message flow:**
- `LAYOUT_UPDATE` is sent by `usePageEditor` whenever `store.site.layout` changes (deep watch) — runtime updates header/footer immediately without a page reload.
- `LAYOUT_BLOCK_SELECT` is sent by the runtime when the user clicks on the header or footer area in the iframe — editor responds by calling `store.selectLayoutBlock(slot)`.

---

## State Management — Pinia (✅ Implemented)

**Store:** `apps/editor/stores/usePageStore.ts`

### State
- `site` — full Site JSON (root state)
- `currentPageId` — ID of the page open in the editor canvas
- `selectedBlockId` — currently selected page block ID (mutually exclusive with `selectedLayoutBlockId`)
- `selectedLayoutBlockId` — `'header' | 'footer' | null` — currently selected layout slot
- `history[]` — undo stack (Page snapshots, current page only, max 50)
- `future[]` — redo stack (cleared on any new block mutation)
- `layoutHistory[]` — undo stack for layout changes (SiteLayout snapshots, max 50)
- `layoutFuture[]` — redo stack for layout changes

### Computed getters
- `currentPage` — `site.pages.find(p => p.id === currentPageId)`
- `page` — **backward-compat alias for `currentPage`** — all existing consumers read this unchanged
- `selectedBlock` — block within `currentPage.blocks` matching `selectedBlockId`
- `selectedLayoutBlock` — `site.layout.header` or `site.layout.footer` based on `selectedLayoutBlockId`
- `canUndo`, `canRedo`, `canUndoLayout`, `canRedoLayout`

### Site actions
- `setSite(site)` — loads full site, clears all history, defaults `currentPageId` to first page
- `setCurrentPage(id)` — switches active page; **clears undo/redo history** (undo is per-page)
- `addPage(page)` — appends page, switches to it
- `removePage(id)` — removes page (guards: never removes last page); switches to previous sibling

### Block actions (operate on `currentPage`)
- `addBlock(type)` — appends block with schema defaults, snapshots
- `updateBlock(block, { snapshot })` — `snapshot: false` for live preview, `snapshot: true` for intentional commits
- `removeBlock(id)` — removes block, snapshots
- `reorderBlocks(fromIndex, toIndex)` — moves one block atomically (snapshot before splice); clears `selectedBlockId`
- `selectBlock(id | null)` — sets selected page block; clears `selectedLayoutBlockId`
- `undo()` / `redo()` — restore/replay `currentPage` snapshots via `_replacePage()`
- `setPage(page)` — backward-compat; updates current page or bootstraps minimal site

### Layout actions (operate on `site.layout`)
- `updateLayout(layout, { snapshot })` — replaces entire `site.layout`
- `updateHeader(block, { snapshot })` — replaces `site.layout.header`; same `snapshot` pattern
- `updateFooter(block, { snapshot })` — replaces `site.layout.footer`
- `addHeader()` — creates header from `HeaderSchema.defaultProps` if absent, then selects it
- `addFooter()` — creates footer from `FooterSchema.defaultProps` if absent, then selects it
- `removeHeader()` / `removeFooter()` — removes slot, snapshots layout
- `selectLayoutBlock(slot | null)` — sets `selectedLayoutBlockId`; clears `selectedBlockId`
- `undoLayout()` / `redoLayout()` — restore/replay `site.layout` from layout stacks

### Key design decisions
- `page` is a computed (not a ref) — `BlockEditorModal` and `usePageEditor` watch it unchanged
- `_replacePage(updated)` is the single mutation point for all block changes — keeps `site.pages` reactive
- `selectBlock` and `selectLayoutBlock` are mutually exclusive — selecting one clears the other
- Layout undo/redo is **independent** from page undo/redo (separate stacks, separate buttons)
- `savePage` and `publishSite` stay in `usePageEditor` as HTTP side effects, not in the store

---

## Implemented Features ✅
- [x] JSON-driven block system with typed schemas
- [x] Schema-driven editor forms (dynamic per block type)
- [x] Scoped CSS generation per block
- [x] Typed postMessage protocol (`EditorMessage`, `sendEditorMessage`, `isEditorMessage`)
- [x] SSR runtime with static generation support
- [x] Pinia store (`usePageStore`) with undo/redo (50-entry history)
- [x] `BlockEditorPanel` (side panel) reads/writes through store — replaces modal pattern
- [x] Undo/Redo buttons in editor UI
- [x] Composables: `usePageEditor`, `useBlockSelection`, `useDragDrop`
- [x] `index.vue` reduced to thin component — zero business logic
- [x] **Full Site model** — `Site`, `SiteLayout`, `SiteVersion`, `LayoutBlock`, `GridDefinition` types in `packages/contracts/page.ts`
- [x] **Multi-page store** — `usePageStore` root state is `site` + `currentPageId`; `page` is a backward-compat computed alias; block actions operate on `currentPage`
- [x] **Page tab switcher** — `index.vue` shows all pages in the site; `+ Página` creates new pages; switching clears undo history
- [x] **Site-level load/save/publish** — `usePageEditor` loads via `GET /api/site`, saves full `Site` JSON, bumps semver patch on publish, records `publishedAt`
- [x] **Version snapshots** — each publish saves a snapshot to `runtime_storage/{siteId}/versions/{version}/site.json`
- [x] **Version history API** — `GET /api/:siteId/versions` returns `SiteVersion[]` newest-first; `versionHistory` ref in `usePageEditor`
- [x] **Rollback API** — `POST /api/:siteId/rollback/:version` restores a snapshot and explodes per-page files
- [x] **Auto-migration** — on first `GET /api/site`, `readSiteFull` wraps existing `data/pages/*.json` into `site.json` transparently
- [x] **Build server** — new modules: `readSiteFull.ts`, `saveSiteFull.ts`, `versionManager.ts`; `GET/POST /site`, `/versions`, `/rollback` routes added to `server.ts`; `GET /page/:slug` still works (reads from `site.json` first)
- [x] **Layout block types** — `HeaderProps`, `FooterProps` in `packages/contracts/blocks/`; `LayoutBlock = BaseBlock<string, any>` already in `page.ts`
- [x] **Layout schemas** — `HeaderSchema` + `FooterSchema` in `packages/ui/schemas/layout/`; `LayoutSchemas` registry exported from `packages/ui/schemas/index.ts`
- [x] **LayoutHeader component** — responsive header with logo (text or image), nav links, mobile hamburger menu, sticky support
- [x] **LayoutFooter component** — responsive footer with column groups, copyright bar, automatic text-contrast based on background color
- [x] **Renderer extended** — `LayoutHeader` + `LayoutFooter` registered; `renderLayoutBlock`, `renderLayoutHeader`, `renderLayoutFooter` exported from `packages/ui`
- [x] **Layout store actions** — `updateHeader`, `updateFooter`, `updateLayout`, `addHeader`, `addFooter`, `removeHeader`, `removeFooter`, `selectLayoutBlock`, `undoLayout`, `redoLayout` — all with snapshot support
- [x] **Dual undo/redo** — page and layout changes have independent history stacks (`layoutHistory`, `layoutFuture`, `canUndoLayout`, `canRedoLayout`)
- [x] **Layout tab in editor** — `useLayoutEditor` composable manages `isLayoutMode`; `index.vue` shows Layout tab with add/edit/remove/undo controls for header and footer
- [x] **LAYOUT_UPDATE message** — `usePageEditor` deep-watches `store.site.layout` and pushes changes to iframe in real-time
- [x] **LAYOUT_BLOCK_SELECT message** — runtime sends slot name when header/footer clicked; `usePageEditor` routes to `store.selectLayoutBlock(slot)`
- [x] **Runtime layout rendering** — `[slug].vue` fetches full site (`GET /api/demosite/site`), renders `LayoutHeader` above and `LayoutFooter` below page blocks; layout blocks are `SelectableBlock`-wrapped in editor mode
- [x] **Professional Block Editor UI** — Right-side sliding panel (`BlockEditorPanel.vue`) replaces `BlockEditorModal`; Tweakpane for `string`/`boolean`/`color` fields (inspector-style); plain `<textarea>` for `json` and `css` fields; live preview on every change (`snapshot: false`); commits undo snapshot on close (`snapshot: true`); Escape key + close button (44×44 px touch target); full-width on mobile (`≤600px`); `useBlockEditorPanel` composable auto-opens/closes on store selection change; handles both page blocks and layout blocks via same `draftContext` pattern
- [x] **Drag & Drop block reordering** — `vue-draggable-plus` (SortableJS) in editor block list panel; `reorderBlocks(fromIndex, toIndex)` store action creates undo snapshot before splice; `useDragDrop` composable provides `draggableBlocks` computed (get/set) + `sortableOptions`; `SelectableBlock` extended with 44×44 px drag handle (`touch-action:none` for WebView); `PAGE_UPDATE` fires automatically via existing `usePageEditor` deep-watch after every reorder
- [x] **AI Prompt Space** — collapsible bottom panel (`AiPromptPanel.vue`), `useAiEditor()` composable, `LLMAdapter` interface with OpenAI/Ollama/Anthropic implementations, SSE streaming with token-by-token display, `AI_PATCH` postMessage to runtime for live preview, undo-integrated via manual history snapshot before `store.setPage()`; schema context serialized by Nuxt proxy and embedded in LLM system prompt; `POST /api/ai/prompt` on build server; env vars: `LLM_PROVIDER`, `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY`
- [x] **Voice Input + Text-to-Voice hook** — WebSocket transcription server (`ws` package) on `/transcription` path sharing port 2999; `TranscriptionAdapter` interface with `WhisperAdapter` (POST /asr multipart, faster-whisper / whisper.cpp compatible) and `MockWhisperAdapter` (dev fallback when `WHISPER_BASE_URL` unset); WS protocol: `VOICE_CHUNK` / `VOICE_END` client→server, `TRANSCRIPT_TOKEN` / `TRANSCRIPT_DONE` / `TRANSCRIPT_ERROR` server→client; `useVoiceInput()` composable — listens for `VOICE_INPUT` postMessages from native layer, forwards audio chunks via WS, accumulates `liveTranscript` ref, populates `aiPrompt` on completion; mic button in `AiPromptPanel` (44×44 px, pulsing red ring while listening, ghost placeholder text shows live transcript); `AI_VOICE_RESPONSE` postMessage sent by `useAiEditor` after SSE completes — forwarded by runtime to native container for TTS (no web audio playback); env vars: `WHISPER_BASE_URL`, `NUXT_PUBLIC_WS_URL`; native TTS integration pending (separate phase — see Android/iOS TODO comments)
- [x] **Collaborative Editing** — Yjs CRDT sync via y-websocket; PostgreSQL persistence (`sites` + `site_versions` tables, JSONB + collab_state BYTEA); `setupCollaborationServer` on port 2999 (`/collaboration/*` path, noServer WebSocket routing alongside `/transcription`); `useCollaboration()` composable — bidirectional Pinia ↔ Y.Map sync (100 ms debounce, `_suppressSync` flag + `nextTick` loop prevention); presence via y-websocket awareness protocol; `UserPresence` type + `presenceColorFromId()` in `@cms/contracts`; `PresenceBar.vue` — avatar circles (HSL color, initials, pulsing ring on active edit, +N overflow, "you" chip); `PRESENCE_UPDATE` EditorMessage for editor→runtime iframe; `SelectableBlock` peer prop — 3 px HSL left border with CSS transition; runtime `peerMap` tracking presence per block; `useBlockSelection` non-blocking conflict warning toast (3 s auto-dismiss); 6 unit tests (node:test) covering color determinism, two-client sync, concurrent merge, encoding round-trip; env var: `DATABASE_URL`; node-build-server tsconfig upgraded to `moduleResolution: "bundler"` for sub-path exports

---

## Roadmap — Pending Features

### 1. ✅ Multi-Page Site Model — COMPLETE
All sub-tasks done. `Site` model implemented, multi-page store, page tabs, site-level save/publish, version snapshots, rollback API, auto-migration.

### 2. ✅ Layouts, Header, Footer, Grids — COMPLETE
All sub-tasks done. `LayoutHeader` + `LayoutFooter` block types, schemas, components, renderer integration, store actions with undo/redo, Layout tab in editor, live LAYOUT_UPDATE preview, LAYOUT_BLOCK_SELECT click-to-edit from runtime.
- Pending: **Grid system** (`SiteLayout.grids[]`) — type placeholder exists, UI and renderer integration not yet built

### 3. ✅ Drag & Drop Editor — COMPLETE
- `vue-draggable-plus` (SortableJS) installed in `apps/editor`
- `useDragDrop()` composable: `draggableBlocks` computed (get/set), `sortableOptions` (`handle`, `delay: 150`, `delayOnTouchOnly: true`, `ghostClass`, `chosenClass`)
- `reorderBlocks(fromIndex, toIndex)` in `usePageStore`: snapshots, splices, calls `_replacePage()`
- `SelectableBlock.vue` extended: absolute drag handle, 6-dot SVG grip, 44×44 px, `touch-action:none`, visible on hover (desktop) / always visible (`pointer:coarse` media query)
- `index.vue` page-mode section: `<VueDraggable v-model="draggableBlocks">` wraps the block list; each `SelectableBlock` item wires `@select → store.selectBlock`
- Global CSS: `.drag-ghost` (dashed blue), `.drag-chosen` (box-shadow) in unscoped `<style>` in `index.vue`
- Reorder triggers `PAGE_UPDATE` automatically via existing `usePageEditor` deep-watch — no extra postMessage code needed
- Pending: drag & drop within the **iframe** preview (runtime-side) — currently only the editor panel list is draggable

### 4. ✅ Professional Block Editor UI — COMPLETE
- `BlockEditorPanel.vue` — fixed right-side panel (320px desktop, full-width mobile), slides in with CSS transition
- `useBlockEditorPanel.ts` — composable managing `isPanelOpen` + `panelMode`; auto-opens/closes via watch on store selection
- Tweakpane (`tweakpane@^4.0.5`) for `string`, `boolean`, `color` fields; plain `<textarea>` for `json` and `css`
- Live preview on every Tweakpane `change` event (`snapshot: false`); one undo snapshot committed on panel close
- Escape key + visible close button (44×44 px) — keyboard and touch accessible
- Handles both page blocks and layout blocks (header/footer) via `draftContext`
- `BlockEditorModal.vue` deleted; `index.vue` restructured into sidebar + preview flex layout

### 5. ✅ AI Prompt Space — COMPLETE
- `AiPromptPanel.vue` — bottom sliding panel, shrinks iframe via flex column layout; prompt textarea (Ctrl+Enter submit), streamed token display, error area, 44×44 px touch targets
- `useAiEditor()` composable — `isAiPanelOpen`, `aiPrompt`, `isLoading`, `aiError`, `streamedTokens`; SSE fetch with token accumulation; manual undo snapshot + `store.setPage()` + `AI_PATCH` postMessage on completion
- `apps/editor/server/api/ai-prompt.post.ts` — serializes `BlockSchemas`+`LayoutSchemas` from `@cms/ui`, forwards to build server with SSE streaming passthrough via `sendStream`
- `node-build-server/src/llm/` — `LLMAdapter` interface, `OpenAIAdapter` (OpenAI + Ollama), `AnthropicAdapter`, `createLLMAdapter()` factory
- `POST /api/ai/prompt` on build server — builds LLM system prompt with schema + page context; streams SSE tokens or returns JSON
- Runtime `AI_PATCH` handler in `[slug].vue` — merges partial page payload onto current page for live preview
- `.env.example` documents `LLM_PROVIDER`, `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY`

### 6. ✅ Voice Input + Text-to-Voice — COMPLETE (web layer)
- ✅ WebSocket transcription server at `ws://localhost:2999/transcription` (shared port with Express via `http.createServer`)
- ✅ `TranscriptionAdapter` interface — `WhisperAdapter` (POST /asr multipart) + `MockWhisperAdapter` dev fallback
- ✅ WS message protocol: `VOICE_CHUNK` / `VOICE_END` → `TRANSCRIPT_TOKEN` / `TRANSCRIPT_DONE` / `TRANSCRIPT_ERROR`
- ✅ `useVoiceInput()` composable — native postMessage listener + WS client + `liveTranscript` ref + `aiPrompt` population
- ✅ Mic button in `AiPromptPanel` (44×44 px touch target, pulsing red ring, ghost transcript placeholder)
- ✅ `AI_VOICE_RESPONSE` message type — sent by editor after AI completes, forwarded by runtime to native container
- ✅ New message types: `VOICE_INPUT`, `VOICE_TRANSCRIPT`, `AI_VOICE_RESPONSE` in `@cms/contracts`
- ✅ Env vars: `WHISPER_BASE_URL` (node-build-server), `NUXT_PUBLIC_WS_URL` (editor)
- **Pending (separate phase):** Native Android/iOS TTS integration — Android should use `TextToSpeech` API, iOS should use `AVSpeechSynthesizer` when the WebView emits an `AI_VOICE_RESPONSE` postMessage. See TODO comments in `useAiEditor.ts` and `[slug].vue`.

### 7. ✅ Page Generation from URL or Screenshot — COMPLETE
- ✅ **URL → Page JSON:** Puppeteer captures viewport screenshot + DOM text outline; vision models receive both, text-only models receive text only; `POST /api/:siteId/generate/url`
- ✅ **Screenshot → Page JSON:** PNG/JPG/WEBP upload as base64 data URI; requires vision model; returns 400 with clear message for text-only models; `POST /api/:siteId/generate/screenshot`
- ✅ **HTML paste → Page JSON:** Server-side DOMPurify sanitisation + jsdom DOM outline; works with text-only LLMs; `POST /api/:siteId/generate/html`
- ✅ **`isVisionCapable()`** in `factory.ts` — detects vision support per provider: all Anthropic models, gpt-4o/vision for OpenAI, llava/moondream/bakllava/llava-llama3/llava-phi3 for Ollama
- ✅ **LLMMessage extended** with optional `image?: LLMImageInput` field; both OpenAI and Anthropic adapters handle multimodal messages
- ✅ **One-retry logic** in `pageGeneratorService.ts`: if LLM returns invalid JSON, sends a correction prompt and tries once more; throws with `raw` field on second failure
- ✅ **SSE streaming** for all three flows — tokens appear in modal as they arrive
- ✅ **`GeneratePageModal.vue`** — three-tab modal (URL / Captura / HTML), file dropzone, loading spinner, error display, auto-closes on success
- ✅ **`usePageGenerator()`** composable — manages modal state + SSE fetch + `store.addPage()` + slug deduplication
- ✅ **⚡ button** in editor tab bar (44×44 px touch target) opens the modal
- ✅ **8 unit tests** in `node-build-server/src/__tests__/pageGenerator.test.ts` (node:test, all passing)
- ✅ **Nuxt proxy routes** in `apps/editor/server/api/` — inject schema context, forward SSE stream
- **Remaining constraint:** Screenshot flow requires a vision-capable model; text-only Ollama models (llama3, mistral, etc.) cannot process screenshots — returns HTTP 400 with descriptive error

### 8. Versioned Site Publishing — partially complete ✅
- ✅ Version snapshots saved to `runtime_storage/{siteId}/versions/{version}/site.json` on every publish
- ✅ `GET /api/:siteId/versions` returns `SiteVersion[]`; `versionHistory` ref exposed from `usePageEditor`
- ✅ `POST /api/:siteId/rollback/:version` restores a snapshot and explodes per-page files
- Pending: UI for browsing and rolling back versions (requires a version history panel in `index.vue`)
- Pending: CSS versioning per snapshot (currently only `site.json` is snapshotted, not the built static assets)

### 9. ✅ Collaborative Editing — COMPLETE
- ✅ **Postgres persistence** — `db/client.ts` (pg Pool), `db/migrate.ts` (`sites` + `site_versions` JSONB tables); `readSiteFull` / `saveSiteFull` / `versionManager` rewritten with Postgres primary + filesystem fallback; `npm run migrate` creates tables; env var: `DATABASE_URL`
- ✅ **Yjs collaboration server** — `collaboration/yjsServer.ts` implements full y-websocket binary protocol (MESSAGE_SYNC + MESSAGE_AWARENESS); shares port 2999 via `noServer: true` + manual `httpServer.on('upgrade')` routing; per-siteId Y.Doc + Awareness in memory; debounce-persists collab_state BYTEA to Postgres (500 ms)
- ✅ **`UserPresence` type** + `presenceColorFromId()` in `packages/contracts/presence.ts`; exported from `@cms/contracts`; `PRESENCE_UPDATE` added to `EditorMessage` union
- ✅ **`useCollaboration()` composable** — WebsocketProvider to `${NUXT_PUBLIC_WS_URL}/collaboration/${siteId}`; seeds Y.Doc from Pinia on connect; bidirectional sync with `_suppressSync` + `nextTick` loop prevention; awareness tracks `selectedBlockId` / `selectedLayoutBlockId`; pushes `PRESENCE_UPDATE` postMessage to runtime iframe on awareness change
- ✅ **`PresenceBar.vue`** — avatar circles (28 px, HSL color, first initial), pulsing ring when editing, tooltip, +N overflow, dashed "you" chip; connected/disconnected dot
- ✅ **Peer block highlight** — `SelectableBlock` accepts `peer?: { color, displayName }` prop; 3 px left border with `--peer-color` CSS variable + transition; runtime builds `peerMap` from `PRESENCE_UPDATE` payload
- ✅ **Conflict warning** — `useBlockSelection` checks peers before `store.selectBlock()`; non-blocking `conflictWarning` toast ref with 3 s auto-dismiss shown in `index.vue`
- ✅ **6 unit tests** in `node-build-server/src/__tests__/collaboration.test.ts` — color determinism, two-client sync, concurrent merge, encoding round-trip
- ✅ **tsconfig fix** — `moduleResolution: "bundler"` (TS 5.0+) to resolve `y-protocols/sync`, `lib0/encoding` sub-path exports

### 10. Content Security Policy (CSP)
- All published pages must include CSP headers
- JavaScript and CSS must use nonces (not `unsafe-inline`)
- Nonce generation happens at `node-build-server` level during static generation
- The renderer must inject nonces into `<script>` and `<style>` tags at build time

### 11. ✅ HTML → Block Conversion — COMPLETE (merged into Feature #7)
- Implemented as the "HTML" tab of the Generate Page modal
- Flow: paste HTML → server DOMPurify sanitisation + jsdom outline → LLM → `Page` JSON
- SSE streaming, works with text-only local LLMs

---

## Platform Strategy
The editor UI is a web app (Nuxt) designed to be embedded as a **WebView** in:
- **Desktop:** Electron or Tauri wrapper
- **Mobile:** iOS and Android native app with WebView

Implications:
- All editor interactions must be touch-friendly
- Voice input is initiated from the native mobile layer, communicated to the WebView via postMessage
- Drag & drop must support touch events, not just mouse events
- No features should rely on browser APIs unavailable in WebView

---

## LLM Integration Strategy
- All LLM calls go through a single adapter interface: `LLMAdapter`
- Adapter supports: Ollama (local, OpenAI-compatible API), OpenAI, Anthropic Claude
- Configuration via env vars: `LLM_PROVIDER`, `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY`
- Minimum viable local model: any 7B parameter model (~7GB VRAM)
- For vision tasks (screenshot → JSON): requires a vision-capable model (LLaVA, GPT-4o, Claude)
- All prompts must include the serialized block schema as context so the LLM knows valid block types

---

## Architecture Rules
- All page/site state mutations go through `usePageStore` — never mutate state directly in components
- All postMessage communication uses `sendEditorMessage()` from `@cms/contracts` — never raw `postMessage`
- All new editor logic goes into composables in `apps/editor/composables/` — never directly in components
- **New page block types** require: type in `packages/contracts/blocks/`, schema in `packages/ui/schemas/blocks/`, component in `packages/ui/components/`, entry in `BlockSchemas` registry, entry in renderer registry
- **New layout block types** require: type in `packages/contracts/blocks/`, schema in `packages/ui/schemas/layout/`, component in `packages/ui/components/`, entry in `LayoutSchemas` registry, entry in renderer registry
- CSS is always generated via `generateBlockCss.ts` — never write block styles inline
- All LLM calls go through the `LLMAdapter` interface — never call LLM APIs directly from components
- Layout block props use **flat keys** (no nested objects) so `BlockEditorModal` can bind them with `draft.props[field.key]` directly
- Complex array props (`navLinks`, `columns`) use `type: 'json'` in the schema — the component must accept both Array and JSON string at runtime
- **Page generation routes** on node-build-server: `POST /api/:siteId/generate/url`, `POST /api/:siteId/generate/screenshot`, `POST /api/:siteId/generate/html` — all require `schemaContext` in body (injected by Nuxt proxy)
- **Vision capability** is checked via `isVisionCapable()` from `node-build-server/src/llm/factory.ts` before sending image data to the LLM — screenshot route returns HTTP 400 for text-only models

---

## Known Limitations (to address)
- File system used as database — needs Postgres/MongoDB for multi-user and versioning
- No single block registration point — adding blocks requires changes in 3–4 places
- No CSP/nonce system yet
- No collaborative editing support yet
- Version rollback UI not yet built (API exists — `versionHistory` ref is available in `usePageEditor`)
- `siteId` is hardcoded as `'demosite'` throughout — needs to become dynamic for multi-tenant SaaS
- Grid system (`SiteLayout.grids[]`) type placeholder exists but UI and renderer integration pending
- Screenshot/URL page generation requires a vision-capable model (gpt-4o, claude-opus-4-6, llava, moondream); text-only models can only use the HTML flow
- Puppeteer Chromium is downloaded to `~/.cache/puppeteer/` — requires ~300MB disk space; use `puppeteer-core` + system Chrome if disk is constrained
