# Editor Application (apps/editor)

## Entry Point
- **Path**: `apps/editor/pages/index.vue`
- **Type**: Thin shell component (zero business logic)
- **Template**: Renders layout + calls composables
- **Port**: 3000 (CSR, no SSR)

## Core Composables

### usePageEditor
- **Path**: `apps/editor/composables/usePageEditor.ts`
- **Purpose**: Page/layout lifecycle, save, publish, iframe sync, message listener
- **Key Functions**:
  - `loadPage()`: Fetches from backend via `GET /api/sites/:siteId`
  - `savePage()`: POST to backend, triggers snapshot
  - `publishPage()`: Builds static HTML
  - `watchPageChanges()`: Debounced sync to iframe on `store.site` change
  - `handleEditorMessage()`: Listens for runtime messages (BLOCK_SELECT, BLOCK_REORDER)
- **State**: Returns `{ currentPage, unsavedChanges, isPublishing }`
- **Template Ref**: Uses `previewFrame` to access iframe element

### useLayoutEditor
- **Path**: `apps/editor/composables/useLayoutEditor.ts`
- **Purpose**: Layout mode state, header/footer activation
- **Key Functions**:
  - `activateLayoutMode()`: Set `isLayoutMode = true`
  - `activatePage()`: Return to page edit mode
  - `addOrSelectHeader()`: Create/select layout header block
  - `addOrSelectFooter()`: Create/select layout footer block
- **State**: `isLayoutMode` (ref), `store.selectedLayoutBlockId` (Pinia)

### useBlockEditorPanel
- **Path**: `apps/editor/composables/useBlockEditorPanel.ts`
- **Purpose**: Right-side sliding panel open/close, auto-open on selection
- **Key Functions**:
  - `openPanel(mode?: 'block'|'layout')`: Opens editor panel
  - `closePanel()`: Hides panel
  - `watch(store.selectedBlockId)`: Auto-open on block selection
  - `watch(store.selectedLayoutBlockId)`: Auto-open on layout block selection
- **State**: `isPanelOpen` (ref), `panelMode` (ref)

### useCollaboration
- **Path**: `apps/editor/composables/useCollaboration.ts`
- **Purpose**: Yjs CRDT sync, presence updates, multi-user awareness
- **Key Functions**:
  - `connect()`: WebSocket to `/collaboration/:siteId`
  - `seedYDoc()`: Initialize Y.Doc from store on connect
  - `ysite.observe()`: Watch remote changes, update Pinia store
  - `watch(store.site, { deep: true })`: Debounced 100ms, sync local→Yjs
- **Parameters**: `(siteId, previewFrameRef)`
- **Returns**: `{ isConnected, connectedUsers, localUser, provider }`
- **Note**: `_suppressSync` flag + `nextTick` prevents echo loops

### useBlockSelection
- **Path**: `apps/editor/composables/useBlockSelection.ts`
- **Purpose**: Selection facade with peer conflict warning
- **Functions**:
  - `selectBlock(id)`: Updates store, triggers warning if peer selected
  - `conflictWarning`: ref<string | null> auto-clears after 3s
- **Parameters**: `{ connectedUsers }`

### useFormEndpoints
- **Path**: `apps/editor/composables/useFormEndpoints.ts`
- **Purpose**: CRUD for form submission endpoints
- **Functions**:
  - `load()`: Fetch endpoints from `GET /api/:siteId/form-endpoints`
  - `create(data)`: `POST /api/:siteId/form-endpoints`
  - `remove(key)`: `DELETE /api/:siteId/form-endpoints/:key`
- **Returns**: `{ endpoints, isLoading, load, create, remove }`

### usePageGenerator
- **Path**: `apps/editor/composables/usePageGenerator.ts`
- **Purpose**: Generate page from URL/screenshot/HTML
- **Functions**:
  - `openModal()`: Display modal
  - `generateFromUrl(url)`: POST to `/api/generate-url`, SSE streaming
  - `generateFromScreenshot(file)`: POST to `/api/generate-screenshot`
  - `generateFromHtml(html)`: POST to `/api/generate-html`
- **Returns**: `{ isModalOpen, openModal, generateFromUrl/Screenshot/Html }`
- **Note**: Uses `_uniqueSlug()` for deduplication

### useAiEditor
- **Path**: `apps/editor/composables/useAiEditor.ts`
- **Purpose**: AI prompt panel state, SSE streaming, undo snapshot
- **Functions**:
  - `openPanel()`: Show AI input panel
  - `submitPrompt(prompt)`: SSE fetch to `/api/ai-prompt`, streams tokens
  - `applyPatch()`: Dispatch AI_PATCH message to runtime
- **Returns**: `{ isPanelOpen, isLoading, tokens, error }`
- **Note**: Takes snapshot before patch for undo

### useDragDrop
- **Path**: `apps/editor/composables/useDragDrop.ts`
- **Purpose**: Drag & drop via Vue Draggable Plus (sidebar only)
- **Functions**: Reorder blocks in sidebar
- **Note**: Preview iframe uses HTML5 drag events + BLOCK_REORDER postMessage instead

## Components

### BlockEditorPanel
- **Path**: `apps/editor/components/BlockEditorPanel.vue`
- **Purpose**: Right-side form for editing selected block/layout block
- **Props**: None (reads store directly)
- **Fields**:
  - String: Text input via Tweakpane
  - Boolean: Toggle via Tweakpane
  - Color: Color picker via Tweakpane (uses proxy before write)
  - Array: ArrayField.vue with add/remove/reorder
  - JSON/CSS: Textarea for deeply nested structures
- **Dispatch**: `store.updateBlock/Header/Footer` with `{ snapshot }` flag
- **Schema Resolution**: LayoutSchemas first, then BlockSchemas

### ArrayField
- **Path**: `apps/editor/components/ArrayField.vue`
- **Purpose**: Editor for array fields (flat objects only)
- **Props**: `subfields: SubfieldDef[]` (key, label, type)
- **Behavior**: Add/remove/reorder buttons, normalizes JSON strings

### PresenceBar
- **Path**: `apps/editor/components/PresenceBar.vue`
- **Purpose**: Show connected users (avatars + initials)
- **Layout**: 28px HSL circles, pulsing ring, +N overflow, "you" chip

### GeneratePageModal
- **Path**: `apps/editor/components/GeneratePageModal.vue`
- **Purpose**: UI for page generation
- **Tabs**: URL, Screenshot, HTML upload
- **Behavior**: Dropzone, SSE streaming output, auto-close on success

### AiPromptPanel
- **Path**: `apps/editor/components/AiPromptPanel.vue`
- **Purpose**: Bottom sliding panel for AI editing
- **UI**: Prompt textarea, streamed token display, error message

## State (Pinia Store)

### usePageStore
- **Path**: `apps/editor/stores/usePageStore.ts`
- **State**:
  - `site`: Full Site structure (pages[], layouts)
  - `currentPageId`: Active page ID
  - `selectedBlockId`: Currently selected block
  - `selectedLayoutBlockId`: Currently selected layout block (header/footer)
  - `history[]`: Page edit snapshots (max 50)
  - `future[]`: Redo snapshots
  - `layoutHistory[]`: Layout edit snapshots
  - `layoutFuture[]`: Layout redo snapshots
- **Getters**:
  - `currentPage`: Active page object
  - `page`: Alias for `currentPage`
  - `selectedBlock`: Block matching `selectedBlockId`
  - `selectedLayoutBlock`: Layout block (header/footer)
  - `canUndo`, `canRedo`, `canUndoLayout`, `canRedoLayout`
- **Page Actions**:
  - `setPage(page)`: Replace current page (NO snapshot)
  - `addBlock(block)`: Push to `currentPage.blocks`
  - `updateBlock(block, { snapshot: bool })`: Modify block props
  - `removeBlock(id)`: Delete block
  - `selectBlock(id)`: Set `selectedBlockId`, clear layout selection
  - `undo()`: Pop history, push to future
  - `redo()`: Pop future, push to history
- **Layout Actions**:
  - `updateLayout(layout)`: Replace layout object
  - `updateHeader(header, { snapshot: bool })`
  - `updateFooter(footer, { snapshot: bool })`
  - `addHeader()`: Create header if missing
  - `addFooter()`: Create footer if missing
  - `removeHeader()`, `removeFooter()`
  - `selectLayoutBlock(slot)`: Set `selectedLayoutBlockId`, clear page selection
  - `undoLayout()`, `redoLayout()`
- **Important**: Mutations snapshot history only when called (no auto-snapshots)

## Server Routes (Nuxt SSR)

### /api/sites/:siteId
- **GET**: Fetch full site
- **PUT**: Save site changes

### /api/ai-prompt.post
- **Body**: `{ prompt, pageJson, siteId, schemaContext }`
- **Returns**: SSE stream (tokens)
- **Purpose**: Proxy to backend LLM endpoint

### /api/generate-url.post
- **Body**: `{ url, schemaContext }`
- **Returns**: SSE stream (page JSON)

### /api/generate-screenshot.post
- **Body**: FormData `{ image, schemaContext }`
- **Returns**: SSE stream (page JSON)

### /api/generate-html.post
- **Body**: `{ html, schemaContext }`
- **Returns**: SSE stream (page JSON)

### /api/products
- **GET**: List products
- **POST**: Create product

### /api/products/:slug
- **GET**: Fetch product by slug

### /api/form-endpoints
- **GET**: List endpoints
- **POST**: Create endpoint
- **DELETE**: Delete endpoint by key

## UI State Patterns
- Page edit: `selectedBlockId` set, layout controls hidden
- Layout edit: `isLayoutMode = true`, `selectedLayoutBlockId` set, page blocks disabled
- Panel: Auto-opens on selection via `useBlockEditorPanel` watcher
- Live edits: `{ snapshot: false }` for each keystroke
- Commit: `{ snapshot: true }` on panel close or explicit save

## Message Flow
1. Editor modifies block → `store.updateBlock()`
2. Watcher fires → `sendEditorMessage(PAGE_UPDATE)` to iframe
3. Runtime receives → updates preview, broadcasts `BLOCK_SELECT` back
4. Editor receives → updates `selectedBlockId`, opens panel

## Performance Notes
- Debounced sync: 100ms (useCollaboration)
- History limit: 50 snapshots max
- CSS generation: Per-block, scoped by `.block-{id}`
- Drag-drop: SortableJS on sidebar, HTML5 on iframe preview
