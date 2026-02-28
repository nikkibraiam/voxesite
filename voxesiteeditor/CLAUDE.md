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
| `packages/contracts/page.ts` | Core types: `Page`, `BaseBlock<TType, TProps>` |
| `packages/contracts/messages.ts` | ✅ Typed postMessage protocol: `EditorMessage`, `sendEditorMessage`, `isEditorMessage` |
| `packages/ui/renderer/renderComponent.ts` | Maps JSON blocks → Vue components via `h()` |
| `packages/ui/schemas/` | Block schemas (drives editor forms dynamically) |
| `packages/ui/wrappers/SelectableBlock.vue` | Click selection wrapper for blocks |
| `packages/utils/css/generateBlockCss.ts` | Generates scoped CSS from block styles |
| `apps/editor/stores/usePageStore.ts` | ✅ Pinia store — central page state |
| `apps/editor/composables/usePageEditor.ts` | ✅ HTTP side effects: load, save, publish |
| `apps/editor/composables/useBlockSelection.ts` | ✅ Block selection logic |
| `apps/editor/composables/useDragDrop.ts` | ✅ Placeholder — ready for Vue Draggable Plus |
| `apps/editor/pages/index.vue` | ✅ Thin component — only imports and composable calls |
| `apps/editor/modals/BlockEditorModal.vue` | Block property editor (consumes usePageStore) |
| `apps/runtime/pages/[slug].vue` | ✅ Renders blocks from JSON, uses typed messages |

---

## Data Model

### Current: Single Page
```ts
interface Page {
  id: string
  slug: string
  blocks: BaseBlock<string, any>[]
  cssFile?: string
}

type BaseBlock<TType, TProps> = {
  id: string
  type: TType           // "Hero" | "TextBlock"
  props: TProps
  styles?: BlockStyles  // { ".hero__title": { color: "#fff" } }
  customCss?: string
}
```

### Planned: Full Site Model
The JSON model must evolve from a single page to a versioned site with multiple pages, shared layouts, and global components.

```ts
interface Site {
  id: string
  version: string          // semver — published as a versioned snapshot
  pages: Page[]            // home, dashboard, welcome, etc.
  layout: SiteLayout       // shared across all pages
  publishedAt?: string
}

interface SiteLayout {
  header?: LayoutBlock     // global nav/menu
  footer?: LayoutBlock     // global footer
  grids?: GridDefinition[] // responsive grid definitions
}

interface Page {
  id: string
  slug: string             // e.g. "/" | "/about" | "/dashboard"
  title: string
  blocks: BaseBlock<string, any>[]
  cssFile?: string
}
```

**Key decisions:**
- Publishing = the entire site is versioned and deployed atomically, not page by page
- Each publish creates a versioned snapshot (e.g. `v1.0.0`, `v1.0.1`) for rollback
- Layout blocks (header, footer, grids) are separate from page blocks and rendered as wrappers
- CSS is still scoped per block using `.block-{id}` prefix

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
- `page` — full Page JSON
- `selectedBlockId` — currently selected block ID
- `selectedBlock` — computed from `page.blocks`
- `history[]` — undo stack (max 50 snapshots)
- `future[]` — redo stack (cleared on any new mutation)

### Actions
- `setPage(page)` — loads page from API, does NOT create undo snapshot
- `updateBlock(block, { snapshot })` — `snapshot: false` for live preview, `snapshot: true` for intentional commits
- `addBlock(block)` — adds block, creates snapshot
- `removeBlock(id)` — removes block, creates snapshot
- `selectBlock(id | null)` — sets selected block
- `undo()` / `redo()` — navigate history

### Key design decisions
- `BlockEditorModal` watches `selectedBlockId` (not `selectedBlock`) to reset draft — avoids circular update loop
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

---

## Roadmap — Pending Features

### 1. Multi-Page Site Model
- Evolve `Page` → `Site` with `pages[]`, `layout` (header/footer/grids)
- Publishing = full site versioned snapshot, not individual pages
- Version history with rollback support
- `node-build-server` must generate and serve versioned site bundles

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

### 8. Versioned Site Publishing
- Publishing creates a versioned snapshot of the entire site (all pages + layout + CSS)
- Version format: semver (`v1.0.0`) or timestamp-based
- `node-build-server` stores each version separately — no overwrite
- UI shows version history with rollback option
- Output: static HTML + CSS + assets per version, CDN-friendly

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
- Current data model is single-page — needs Site model for multi-page support
- No CSP/nonce system yet
- No collaborative editing support yet