# Voxesite Editor - Project Architecture

## System Overview
Monorepo: Nuxt 4.3 + Vue 3.5, pnpm workspaces. Four main components: editor (CSR), runtime (SSR), packages (@cms), backend (Node.js/Express).

## Project Structure
```
apps/
  ├─ editor (Nuxt CSR, port 3000)
  ├─ runtime (Nuxt SSR, port 3001)
packages/
  ├─ contracts (TypeScript types, messages)
  ├─ ui (Vue components, schemas, renderer)
  └─ utils (CSS generation)
node-build-server/ (Express, port 2999)
```

## Data Flow

### Editor → Runtime
1. Editor modifies page JSON in `usePageStore` (Pinia)
2. Sends `PAGE_UPDATE` message via `sendEditorMessage()`
3. Runtime receives, updates preview iframe, broadcasts `BLOCK_SELECT` back to editor
4. Collaborative: Yjs syncs state across clients via WebSocket (`/collaboration/*`)

### Editor ↔ Backend
1. Editor saves page: `usePageEditor` calls `PUT /api/sites/:siteId`
2. Backend stores in Postgres (sites table, JSONB)
3. Backend publishes: `POST /api/sites/:siteId/publish` builds static HTML
4. Runtime fetches: `GET /api/demosite/site` retrieves full site JSON

### Page Rendering (Editor-side)
1. Page JSON → `renderBlock()` in `packages/ui/renderer/renderComponent.ts`
2. Each block matched to registry (manifest-derived)
3. Vue `h()` called to render component
4. CSS scoped per block: `.block-{id}` class

### Page Rendering (Runtime-side)
1. SSR: `[slug].vue` fetches page via `useAsyncData('product-${slug}')`
2. Injects Nuxt nonce for CSP security
3. Renders full page with dynamic styles
4. ISR configured: products 3600s, blog 86400s

## Message Protocol (`@cms/contracts/messages.ts`)
```
EditorMessage types:
- PAGE_UPDATE: editor→runtime (full page JSON)
- LAYOUT_UPDATE: editor→runtime (layout JSON)
- BLOCK_SELECT: runtime→editor (blockId, x, y coords)
- BLOCK_REORDER: runtime→editor (sourceId, targetId)
- LAYOUT_BLOCK_SELECT: runtime→editor (slot: 'header'|'footer')
- AI_PATCH: editor→runtime (Partial<Page> applied live)
- PRESENCE_UPDATE: any→any (cursor, user info, color)
```

## State Management (Pinia)
- **usePageStore**: site, currentPageId, selectedBlockId, selectedLayoutBlockId, history[], future[]
- Max 50 history snapshots (separate stacks: page + layout)
- Undo/redo actions for both page blocks and layout blocks
- `updateBlock(block, { snapshot: false })` for live edits
- `updateBlock(block, { snapshot: true })` for committed changes

## Block Registry System
**Single source of truth**: `packages/ui/blocks/manifest.ts`
- One entry per page block (34 total)
- Auto-generates `BlockRegistry` (renderer lookup) + `BlockSchemas` (editor forms)
- Layout blocks (LayoutHeader, LayoutFooter) separate, NOT in manifest
- Composite blocks handled before registry lookup

## Authentication & Security
- **CSP**: Nonce generated per request in runtime, injected on `<script>/<style>`
- **Session**: Backend stores in Postgres, env: `SESSION_SECRET`
- **Encryption**: Form endpoints use AES-256-GCM, key: `ENDPOINT_ENCRYPTION_KEY`
- **Rate limiting**: In-memory buckets, 10 req/IP/60s on form submissions

## Environment Variables
```
EDITOR: LLM_PROVIDER, LLM_BASE_URL, LLM_MODEL, LLM_API_KEY
RUNTIME: DATABASE_URL, SESSION_SECRET, NODE_ENV
BACKEND: DATABASE_URL, ENDPOINT_ENCRYPTION_KEY, RUNTIME_URL, CACHE_PURGE_SECRET
```

## Database Schema
```
sites:
  - id (UUID)
  - slug (text)
  - data (JSONB) // full Site structure
  - collab_state (BYTEA) // Yjs binary snapshot
  - timestamps

site_versions:
  - id (UUID)
  - site_id (FK)
  - data (JSONB) // Page[] snapshot
  - version_number (int)

products:
  - id (UUID)
  - site_id (FK)
  - slug (text, UNIQUE with site_id)
  - data (JSONB) // Product structure
  - stock (int)
  - timestamps

form_endpoints:
  - id (UUID)
  - site_id (FK)
  - encrypted_url (text)
  - created_at (timestamp)
```

## Key Composables
- `usePageEditor`: page/layout load, save, publish, iframe sync, message listener
- `useLayoutEditor`: layout mode state, header/footer activation
- `useCollaboration`: Yjs sync, presence updates, connection state
- `useBlockEditorPanel`: editor panel open/close, auto-open on selection
- `useFormEndpoints`: CRUD endpoints for form submissions

## Dependencies Between Projects
```
editor → contracts (types, messages)
editor → ui (components, schemas, renderer)
editor → utils (CSS generation)
runtime → ui (rendering)
runtime → contracts (types)
ui → contracts (types)
utils → contracts (types)
backend → contracts (mirrors types locally)
```
