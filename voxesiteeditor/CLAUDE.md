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
| `node-build-server/src/llm/types.ts` | ✅ `LLMMessage`, `LLMAdapter` interface |
| `node-build-server/src/llm/openaiAdapter.ts` | ✅ OpenAI-compatible adapter (OpenAI + Ollama) |
| `node-build-server/src/llm/anthropicAdapter.ts` | ✅ Anthropic Messages API adapter |
| `node-build-server/src/llm/factory.ts` | ✅ `createLLMAdapter()` — reads `LLM_PROVIDER` env var, returns correct adapter |

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

### 6. Voice Input + Text-to-Voice
- Voice is captured in the mobile app (or browser), sent as audio packets via postMessage (`VOICE_INPUT`)
- Editor backend transcribes audio (Whisper or compatible local model) → feeds transcript into AI prompt pipeline
- **Text-to-Voice response:** AI response is spoken back to the user (TTS) for a conversational feel. Use local TTS model or browser `SpeechSynthesis` API as fallback.
- New message types: `VOICE_INPUT`, `VOICE_TRANSCRIPT`, `AI_VOICE_RESPONSE`

### 7. Page Generation from URL or Screenshot
- **URL → Site JSON:** Server fetches URL (Puppeteer/headless browser), extracts HTML, sends to LLM with block schema as context → returns `Page` JSON
- **Screenshot → Site JSON:** Image upload → vision-capable LLM with block schema → returns `Page` JSON
- **HTML paste → Site JSON:** User pastes raw HTML → server parses DOM → LLM maps elements to block types → returns `Page` JSON (must be near real-time, streaming preferred)
- All three flows must work with local LLMs (vision models like LLaVA for screenshot analysis)
- Block schemas in `packages/ui/schemas/` are serialized and sent as LLM context in all flows

### 8. Versioned Site Publishing — partially complete ✅
- ✅ Version snapshots saved to `runtime_storage/{siteId}/versions/{version}/site.json` on every publish
- ✅ `GET /api/:siteId/versions` returns `SiteVersion[]`; `versionHistory` ref exposed from `usePageEditor`
- ✅ `POST /api/:siteId/rollback/:version` restores a snapshot and explodes per-page files
- Pending: UI for browsing and rolling back versions (requires a version history panel in `index.vue`)
- Pending: CSS versioning per snapshot (currently only `site.json` is snapshotted, not the built static assets)

### 9. Collaborative Editing
- Multiple team members can edit the same site simultaneously
- Architecture options to evaluate: OT (Operational Transformation), CRDT (e.g. Yjs), or lock-based editing
- Presence indicators (who is editing which block)
- Conflict resolution strategy TBD
- **Prerequisite:** Move from file system to a real database (Postgres/MongoDB + WebSockets)

### 10. Content Security Policy (CSP)
- All published pages must include CSP headers
- JavaScript and CSS must use nonces (not `unsafe-inline`)
- Nonce generation happens at `node-build-server` level during static generation
- The renderer must inject nonces into `<script>` and `<style>` tags at build time

### 11. HTML → Block Conversion
- When a user pastes arbitrary HTML, the system converts it to block JSON automatically
- Flow: paste HTML → server parses DOM → LLM maps to block schema → returns `Page` JSON
- Must be near real-time (streaming preferred)
- Security: sanitize all pasted HTML before processing (DOMPurify or equivalent server-side)

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

---

## Known Limitations (to address)
- File system used as database — needs Postgres/MongoDB for multi-user and versioning
- No single block registration point — adding blocks requires changes in 3–4 places
- No CSP/nonce system yet
- No collaborative editing support yet
- Version rollback UI not yet built (API exists — `versionHistory` ref is available in `usePageEditor`)
- `siteId` is hardcoded as `'demosite'` throughout — needs to become dynamic for multi-tenant SaaS
- Grid system (`SiteLayout.grids[]`) type placeholder exists but UI and renderer integration pending
