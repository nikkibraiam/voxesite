# voxesiteeditor — Project Brief for Claude Code

## What is this project?
A SaaS CMS platform where users build and manage web pages through a JSON-based block architecture. The editor allows visual editing, and the roadmap includes AI-powered editing via prompts, voice input, drag & drop, and page generation from URLs or screenshots.

---

## Monorepo Structure

```
voxesiteeditor/
├── apps/
│   ├── editor/          # CMS editor UI (Nuxt 4, CSR, port 3000)
│   └── runtime/         # Live preview + SSR renderer (Nuxt 4, SSR, port 3001)
├── packages/
│   ├── contracts/       # Shared TypeScript interfaces (Page, BaseBlock)
│   ├── ui/              # Vue components, renderer, schemas
│   └── utils/           # CSS generation utilities
└── node-build-server/   # Express backend (port 2999) — persistence, builds
```

### Key files
| File | Role |
|---|---|
| `packages/contracts/page.ts` | Core types: `Page`, `BaseBlock<TType, TProps>` |
| `packages/ui/renderer/renderComponent.ts` | Maps JSON blocks → Vue components via `h()` |
| `packages/ui/schemas/` | Block schemas (drives editor forms dynamically) |
| `packages/ui/wrappers/SelectableBlock.vue` | Click selection wrapper for blocks |
| `packages/utils/css/generateBlockCss.ts` | Generates scoped CSS from block styles |
| `apps/editor/stores/usePageStore.ts` | ✅ Pinia store — central page state |
| `apps/editor/pages/index.vue` | Main editor UI (consumes usePageStore) |
| `apps/editor/modals/BlockEditorModal.vue` | Block property editor (consumes usePageStore) |
| `apps/runtime/pages/[slug].vue` | Renders blocks from JSON (SSR) |

---

## Data Model

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

CSS is scoped per block using `.block-{id}` as the selector prefix.

---

## Editor ↔ Runtime Communication
- The runtime runs inside an `<iframe>` in the editor
- Communication is via `postMessage`
- Current message types include `ADD_BLOCK` and full page JSON updates
- **Planned:** Typed protocol with `PAGE_UPDATE`, `BLOCK_SELECT`, `AI_PATCH`

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
- `updateBlock(block, { snapshot })` — updates a block; `snapshot: false` for live preview (e.g. color picker drag), `snapshot: true` for intentional Apply actions
- `addBlock(block)` — adds block, creates snapshot
- `removeBlock(id)` — removes block, creates snapshot
- `selectBlock(id | null)` — sets selected block
- `undo()` / `redo()` — navigate history

### Key design decisions
- Composition API style (`defineStore('page', () => {...})`)
- `updateBlock` with `snapshot: false` prevents undo entry per keystroke during live color picking
- `BlockEditorModal` watches `selectedBlockId` (not `selectedBlock`) to reset draft — avoids circular update loop
- `savePage` and `publishSite` remain in `index.vue` as HTTP side effects, not in the store

---

## Implemented Features ✅
- [x] JSON-driven block system with typed schemas
- [x] Schema-driven editor forms (dynamic per block type)
- [x] Scoped CSS generation per block
- [x] Editor ↔ Runtime iframe postMessage communication
- [x] SSR runtime with static generation support
- [x] Pinia store (`usePageStore`) with undo/redo (50-entry history)
- [x] `BlockEditorModal` reads/writes through store
- [x] Undo/Redo buttons in editor UI

---

## Roadmap — Pending Features

### 1. Drag & Drop Editor
- Use `Vue Draggable Plus` (wraps SortableJS)
- Create `useDragDrop()` composable
- Extend `SelectableBlock.vue` with drag handle
- Reorder commits atomically through `usePageStore`
- **Prerequisite:** ✅ Pinia already done

### 2. AI Prompt Space
- Panel in editor UI for natural language instructions
- Create `useAiEditor()` composable
- Server-side Nuxt API route: receives `{ prompt, currentPageJson }`, calls LLM, returns modified JSON
- Apply result through `usePageStore.updateBlock()` or `setPage()`
- Support streaming responses for "instant" feel

### 3. Voice Input
- Use native Web Speech API (`SpeechRecognition`) — zero dependencies
- Transcribed text feeds into the same AI prompt pipeline

### 4. Instant AI Interpretation
- AI reads current JSON, modifies it based on prompt, result is applied via Pinia reactivity — no page reload
- postMessage sends updated JSON directly to iframe (no server round-trip needed for preview)
- Requires streaming LLM responses

### 5. Page Generation from URL or Screenshot
- **URL → Page:** Server fetches URL (Puppeteer or headless service), extracts HTML, LLM converts to block JSON
- **Screenshot → Page:** Image upload → vision-capable LLM (Claude vision or GPT-4o) → block JSON
- Block schemas in `packages/ui/schemas/` can be serialized and sent as LLM context

---

## Architecture Rules
- New block types require: schema in `packages/ui/schemas/`, component in `packages/ui/components/`, type in `packages/contracts/`
- All page state mutations go through `usePageStore` — never mutate page state directly in components
- CSS is always generated via `generateBlockCss.ts` — never write block styles inline
- Editor components should be composable-first: extract logic into composables before adding to components

---

## Known Limitations (to address later)
- File system used as database (JSON files) — needs Postgres/MongoDB for multi-user SaaS
- postMessage protocol needs typed message definitions
- No single block registration point — adding blocks requires changes in 3 places