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
| `packages/contracts/messages.ts` | ✅ Typed postMessage protocol: `EditorMessage`, `sendEditorMessage`, `isEditorMessage` |
| `packages/ui/renderer/renderComponent.ts` | Maps JSON blocks → Vue components via `h()` |
| `packages/ui/schemas/` | Block schemas (drives editor forms dynamically) |
| `packages/ui/wrappers/SelectableBlock.vue` | Click selection wrapper for blocks |
| `packages/utils/css/generateBlockCss.ts` | Generates scoped CSS from block styles |
| `apps/editor/stores/usePageStore.ts` | ✅ Pinia store — root state is `site` + `currentPageId`; `page` is a backward-compat computed alias |
| `apps/editor/composables/usePageEditor.ts` | ✅ Load/save full Site, semver publish, version history, iframe page-switch |
| `apps/editor/composables/useBlockSelection.ts` | ✅ Block selection wrapper |
| `apps/editor/composables/useDragDrop.ts` | ✅ Placeholder — ready for Vue Draggable Plus |
| `apps/editor/pages/index.vue` | ✅ Thin component — page tabs, `+ Página` button, dynamic iframe src |
| `apps/editor/server/api/site.get.ts` | ✅ `GET /api/site` — proxies to build server, triggers migration on first load |
| `apps/editor/server/api/save.post.ts` | ✅ `POST /api/save` — accepts full `Site`, generates per-page CSS |
| `apps/editor/modals/BlockEditorModal.vue` | Block property editor (consumes usePageStore — unchanged) |
| `apps/runtime/pages/[slug].vue` | ✅ Renders blocks from JSON, uses typed messages |
| `node-build-server/src/readSiteFull.ts` | ✅ Read `site.json`; auto-migrates from `data/pages/*.json` on first access |
| `node-build-server/src/saveSiteFull.ts` | ✅ Write `site.json` + explode per-page files + CSS |
| `node-build-server/src/versionManager.ts` | ✅ `saveVersion`, `listVersions`, `rollbackVersion` |
| `node-build-server/src/server.ts` | ✅ Express routes — includes Site CRUD, versions, rollback |

---

## Data Model (✅ Implemented)

```ts
type BaseBlock<TType, TProps> = {
  id: string
  type: TType           // "Hero" | "TextBlock"
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
  header?: LayoutBlock  // global nav/menu (placeholder — implemented in roadmap)
  footer?: LayoutBlock
  grids?: GridDefinition[]
}

interface SiteVersion {
  version: string       // e.g. "1.2.0"
  publishedAt: string   // ISO 8601
}
```

**Key decisions:**
- `Site` is the persistence unit — all saves and publishes operate on the full site
- Publishing bumps the semver patch, sets `publishedAt`, saves, then triggers Nuxt build
- Each publish creates a versioned snapshot in `runtime_storage/{siteId}/versions/{version}/site.json`
- `Page.title` is optional for backward compat — existing JSON without it still parses
- CSS is scoped per block using `.block-{id}` prefix; generated per page on every save

---

## Editor ↔ Runtime Communication (✅ Typed)

All postMessage communication uses `sendEditorMessage()` from `@cms/contracts`. Never use raw `postMessage`.

```ts
type EditorMessage =
  | { type: 'PAGE_UPDATE'; payload: Page }
  | { type: 'BLOCK_SELECT'; payload: { blockId: string | null } }
  | { type: 'AI_PATCH'; payload: Partial<Page> }
  | { type: 'VOICE_INPUT'; payload: { audio: Blob } }
  | { type: 'VOICE_TRANSCRIPT'; payload: { text: string } }
  | { type: 'AI_VOICE_RESPONSE'; payload: { text: string; audio?: Blob } }
```

---

## State Management — Pinia (✅ Implemented)

**Store:** `apps/editor/stores/usePageStore.ts`

### State
- `site` — full Site JSON (root state)
- `currentPageId` — ID of the page open in the editor canvas
- `selectedBlockId` — currently selected block ID
- `history[]` — undo stack (Page snapshots, current page only, max 50)
- `future[]` — redo stack (cleared on any new block mutation)

### Computed getters
- `currentPage` — `site.pages.find(p => p.id === currentPageId)`
- `page` — **backward-compat alias for `currentPage`** — all existing consumers read this unchanged
- `selectedBlock` — block within `currentPage.blocks` matching `selectedBlockId`
- `canUndo`, `canRedo`

### Site actions
- `setSite(site)` — loads full site, clears history, defaults `currentPageId` to first page
- `setCurrentPage(id)` — switches active page; **clears undo/redo history** (undo is per-page)
- `addPage(page)` — appends page, switches to it
- `removePage(id)` — removes page (guards: never removes last page); switches to previous sibling

### Block actions (operate on `currentPage`)
- `addBlock(type)` — appends block with schema defaults, snapshots
- `updateBlock(block, { snapshot })` — `snapshot: false` for live preview, `snapshot: true` for intentional commits
- `removeBlock(id)` — removes block, snapshots
- `selectBlock(id | null)` — sets selected block (no snapshot)
- `undo()` / `redo()` — restore/replay `currentPage` snapshots via `_replacePage()`
- `setPage(page)` — backward-compat; updates current page or bootstraps minimal site

### Key design decisions
- `page` is a computed (not a ref) — `BlockEditorModal` and `usePageEditor` watch it unchanged
- `_replacePage(updated)` is the single mutation point for all block changes — keeps `site.pages` reactive
- Undo history is cleared on `setCurrentPage()` — history is scoped to the current page session
- `savePage` and `publishSite` stay in `usePageEditor` as HTTP side effects, not in the store

---

## Implemented Features ✅
- [x] JSON-driven block system with typed schemas
- [x] Schema-driven editor forms (dynamic per block type)
- [x] Scoped CSS generation per block
- [x] Typed postMessage protocol (`EditorMessage`, `sendEditorMessage`, `isEditorMessage`)
- [x] SSR runtime with static generation support
- [x] Pinia store (`usePageStore`) with undo/redo (50-entry history)
- [x] `BlockEditorModal` reads/writes through store
- [x] Undo/Redo buttons in editor UI
- [x] Composables: `usePageEditor`, `useBlockSelection`, `useDragDrop` (placeholder)
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

---

## Roadmap — Pending Features

### 1. ✅ Multi-Page Site Model — COMPLETE
All sub-tasks done. `Site` model implemented, multi-page store, page tabs, site-level save/publish, version snapshots, rollback API, auto-migration.

### 2. Layouts, Header, Footer, Grids
- New block category: `LayoutBlock` — shared across all pages (header, footer, nav menu)
- Responsive grid system: define grid areas in `SiteLayout.grids[]`
- The renderer must wrap page blocks inside the active layout
- Schemas needed for layout blocks (same schema-driven pattern as page blocks)

### 3. Drag & Drop Editor
- Use `Vue Draggable Plus` (wraps SortableJS)
- Complete `useDragDrop()` composable (placeholder already exists)
- Extend `SelectableBlock.vue` with drag handle
- Reorder commits atomically through `usePageStore`
- Must work inside WebView on mobile — use touch-friendly drag events (not just mouse events)

### 4. Professional Block Editor UI
- Current: modal opens on block click — works but may not scale well to mobile
- Options to evaluate:
  - **Side panel** — editor slides in from the right, block stays visible in context
  - **Inline editing** — click directly on text/color in the preview to edit
  - **Floating toolbar** — appears near the selected block
- Decision criteria: must work well in both desktop browser and mobile WebView
- The selected approach must keep the live preview visible while editing

### 5. AI Prompt Space
- Panel in editor UI for natural language instructions
- Create `useAiEditor()` composable
- Server-side Nuxt API route: receives `{ prompt, currentPageJson }`, calls LLM, returns modified Page JSON
- Apply result through `usePageStore.setPage()` (creates undo snapshot first)
- Support streaming responses for real-time feel (`AI_PATCH` messages via postMessage)
- **LLM strategy:** Must support local LLMs via Ollama-compatible API (OpenAI-compatible `/v1/chat/completions` endpoint). Also support cloud LLMs (Claude, OpenAI) via the same interface. Use an adapter pattern so the LLM provider is swappable via env vars.

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
- New block types require: schema in `packages/ui/schemas/`, component in `packages/ui/components/`, type in `packages/contracts/`
- CSS is always generated via `generateBlockCss.ts` — never write block styles inline
- All LLM calls go through the `LLMAdapter` interface — never call LLM APIs directly from components

---

## Known Limitations (to address)
- File system used as database — needs Postgres/MongoDB for multi-user and versioning
- No single block registration point — adding blocks requires changes in 3 places
- No CSP/nonce system yet
- No collaborative editing support yet
- Version rollback UI not yet built (API exists — `versionHistory` ref is available in `usePageEditor`)
- `siteId` is hardcoded as `'demosite'` throughout — needs to become dynamic for multi-tenant SaaS