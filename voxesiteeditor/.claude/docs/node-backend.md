# Node Build Server (Backend)

## Entry Point
- **Path**: `node-build-server/src/server.ts`
- **Type**: Express server
- **Port**: 2999
- **Node Version**: ≥16 (for native fetch)
- **Setup**: `npm install --ignore-scripts` (not in pnpm-workspace.yaml)

## Database

### Client
- **Path**: `src/db/client.ts`
- **Type**: pg Pool singleton
- **Init**: Reads `DATABASE_URL` env var
- **Fallback**: `null` if `DATABASE_URL` unset
- **Query**: Raw SQL (no ORM)

### Schema
- **Path**: `src/db/migrate.ts`
- **Tables**:
  - `sites`: id (UUID), slug (text), data (JSONB), collab_state (BYTEA), timestamps
  - `site_versions`: id (UUID), site_id (FK), data (JSONB), version_number (int)
  - `products`: id (UUID), site_id (FK), slug (text UNIQUE), data (JSONB), stock (int), timestamps
- **Indexes**: site_id, slug, (site_id, slug) UNIQUE
- **Collabs**: `collab_state` stores Yjs binary snapshot

---

## Core Services

### pageGeneratorService
- **Path**: `src/pageGenerator/pageGeneratorService.ts`
- **Purpose**: Generate page from URL/screenshot/HTML
- **Function**: `generatePage(input, inputType, schemaContext)`
- **Input Types**:
  - `'url'`: Full webpage URL
  - `'screenshot'`: Vision model input (image buffer)
  - `'html'`: HTML text
- **Process**:
  1. Fetch/process input (urlFetcher, screenshotHandler, htmlSanitizer)
  2. Build prompt with schemaContext (block registry)
  3. Call SiteCloneAgent LLM
  4. Parse JSON response
  5. One retry on invalid JSON, throw on second failure
- **Returns**: `Page` object
- **Throws**: `{ message, raw }` on error

#### urlFetcher
- **Purpose**: Fetch and sanitize webpage HTML
- **Tool**: Puppeteer (headless Chromium)
- **Logic**:
  1. Launch browser
  2. Navigate to URL
  3. Wait for network idle
  4. Extract page HTML
  5. Sanitize with dompurify
- **Chromium Cache**: `~/.cache/puppeteer/`
- **Note**: Run `node node_modules/puppeteer/install.mjs` if missing

#### screenshotHandler
- **Purpose**: Process screenshot image for vision model
- **Input**: Image file (PNG/JPG)
- **Vision**: Calls vision-capable LLM (OpenAI, Anthropic)
- **Fallback**: Error 400 if model is text-only

#### htmlSanitizer
- **Purpose**: Clean HTML before rendering
- **Tool**: isomorphic-dompurify
- **Logic**: Remove scripts, iframes, event handlers
- **Returns**: Safe HTML string

### SiteCloneAgent
- **Path**: `src/agents/SiteCloneAgent.ts`
- **Purpose**: Clone page structure from URL/screenshot
- **Prompt File**: `.claude/prompts/site-clone-agent.xml`
- **Function**: `runSiteCloneAgent(html, schemaContext)`
- **Logic**:
  1. Load prompt template
  2. Substitute `{{BLOCK_REGISTRY}}` with manifest
  3. Wrap HTML in prompt context
  4. Call LLM with streaming
  5. Extract JSON block from response
  6. One retry on parse failure
- **Returns**: `Page` object (blocks[], metadata)

### SiteBuilderAgent
- **Path**: `src/agents/SiteBuilderAgent.ts`
- **Purpose**: Build page from AI prompt
- **Function**: `buildSiteBuilderPrompt(schemaContext, pageJson)`
- **Prompt File**: `.claude/prompts/site-builder-agent.xml`
- **Substitutions**:
  - `{{BLOCK_REGISTRY}}`: Available blocks + schemas
  - `{{CURRENT_PAGE}}`: Current page structure
  - `{{SNEAKER_STORE_EXAMPLE}}`: Example page (injected via `/generate-agent-examples`)
  - `{{COURSES_PAGE_EXAMPLE}}`: Example page (injected via `/generate-agent-examples`)
- **Returns**: Prompt string (used by `/api/ai-prompt` route)

### LLM Adapter (Factory Pattern)
- **Path**: `src/llm/`
- **Factory**: `src/llm/factory.ts`
  - `createLLMAdapter()`: Reads `LLM_PROVIDER` env
  - `isVisionCapable()`: Detects vision support per provider + model
- **OpenAI Adapter**: `openaiAdapter.ts`
  - Supports: GPT-4 (text + vision), GPT-4o (multimodal)
  - Handles: Text + image messages
- **Anthropic Adapter**: `anthropicAdapter.ts`
  - Supports: Claude 3.5 Sonnet (text + vision)
  - Handles: Text + image messages
- **Ollama Adapter**: openaiAdapter + `LLM_BASE_URL`

#### LLMAdapter Interface
```typescript
interface LLMAdapter {
  chatStream(messages: LLMMessage[], onToken: (token: string) => void): Promise<void>
}

interface LLMMessage {
  role: 'user'|'assistant'
  content: string
  image?: LLMImageInput
}

interface LLMImageInput {
  type: 'url'|'base64'
  data: string
}
```

---

## API Routes

### Site Management

#### GET /api/sites/:siteId
- **Purpose**: Fetch full site
- **Response**: `{ id, slug, data: Site, collab_state }`
- **Query**: `SELECT * FROM sites WHERE id = $1`

#### PUT /api/sites/:siteId
- **Purpose**: Save site changes
- **Body**: `{ data: Site, collab_state?: Buffer }`
- **Updates**: Postgres JSONB + Yjs snapshot
- **Returns**: Updated site

#### POST /api/sites/:siteId/publish
- **Purpose**: Build static HTML for deployment
- **Function**: `buildSite(site)`
- **Output**: Static files per page
- **Headers**: `.headers.json` sidecar + `_headers` (Netlify/Cloudflare)

### Page Generation

#### POST /api/:siteId/generate/url
- **Body**: `{ url: string, schemaContext: SchemaContext }`
- **Returns**: SSE stream (page JSON tokens)
- **Process**:
  1. Fetch URL via Puppeteer
  2. Sanitize HTML
  3. Call SiteCloneAgent
  4. Stream page JSON

#### POST /api/:siteId/generate/screenshot
- **Body**: FormData `{ image: File, schemaContext }`
- **Returns**: SSE stream (page JSON tokens)
- **Process**:
  1. Read image buffer
  2. Call vision LLM (SiteCloneAgent)
  3. Stream page JSON
- **Error**: 400 if model is text-only

#### POST /api/:siteId/generate/html
- **Body**: `{ html: string, schemaContext }`
- **Returns**: SSE stream (page JSON tokens)
- **Process**:
  1. Sanitize HTML
  2. Call SiteCloneAgent
  3. Stream page JSON

### AI Prompt Editing

#### POST /api/ai-prompt
- **Body**: `{ prompt, pageJson, siteId, schemaContext }`
- **Returns**: SSE stream (patch tokens)
- **Process**:
  1. Build prompt via SiteBuilderAgent
  2. Call LLM with streaming
  3. Stream tokens as they arrive
- **LLM Input**: Includes current page, block schemas, user prompt
- **LLM Output**: Partial<Page> JSON patches

### Form Management

#### POST /api/:siteId/form-submit
- **Body**: `{ fields: { key: value }[], endpointKey: string }`
- **Purpose**: Submit form to external endpoint
- **Process**:
  1. Decrypt `endpointKey` → URL (AES-256-GCM)
  2. Re-validate form data
  3. POST to external URL
  4. Return `{ success: boolean, status: number }`
- **Rate Limiting**: 10 req/IP/60s (in-memory buckets)
- **Logging**: Audit log to stdout (no sensitive data)

#### GET /api/:siteId/form-endpoints
- **Purpose**: List form endpoints
- **Response**: `{ key, createdAt }[]` (URL encrypted)
- **Query**: `SELECT * FROM form_endpoints WHERE site_id = $1`

#### POST /api/:siteId/form-endpoints
- **Purpose**: Create new endpoint
- **Body**: `{ name: string, url: string }`
- **Process**:
  1. Generate random key
  2. Encrypt URL with `ENDPOINT_ENCRYPTION_KEY`
  3. Save to DB
- **Returns**: `{ key, createdAt }`

#### DELETE /api/:siteId/form-endpoints/:key
- **Purpose**: Delete endpoint
- **Query**: `DELETE FROM form_endpoints WHERE id = $1`

### Product Management

#### GET /api/:siteId/products
- **Purpose**: List all products for site
- **Query**: `SELECT * FROM products WHERE site_id = $1`
- **Response**: `Product[]`

#### POST /api/:siteId/products
- **Purpose**: Create product
- **Body**: `{ slug, title, price, stock, category, image, ... }`
- **Process**:
  1. Validate slug (UNIQUE per site_id)
  2. Insert to DB
  3. Call `invalidateProductCache(siteId, slug)` (non-fatal)
- **Returns**: `Product` (with id)

#### GET /api/:siteId/products/:slug
- **Purpose**: Fetch product by slug
- **Query**: `SELECT * FROM products WHERE site_id = $1 AND slug = $2`
- **Response**: `Product`

#### PUT /api/:siteId/products/:id
- **Purpose**: Update product
- **Body**: Partial `Product`
- **Process**:
  1. Update in DB
  2. Call `invalidateProductCache(siteId, slug)` (non-fatal)
- **Returns**: Updated `Product`

#### GET /api/:siteId/products/category/:catSlug
- **Purpose**: List products in category
- **Query**: `SELECT * FROM products WHERE site_id = $1 AND category = $2`
- **Response**: `Product[]`
- **Note**: Route MUST be before `/:slug` to avoid Express ambiguity

### Collaboration (Yjs)

#### WebSocket /collaboration/:siteId
- **Protocol**: y-websocket binary
- **Server**: `noServer: true`, manual routing in `httpServer.on('upgrade')`
- **Purpose**: Real-time multi-user sync via CRDT
- **Persistence**: Yjs binary snapshot stored in Postgres `collab_state`
- **Auto-sync**: `watch(store.site)` debounced 100ms on client

---

## Security

### Nonce Generator
- **Path**: `src/security/nonceGenerator.ts`
- **Function**: `generateNonce()` → base64url
- **Entropy**: 16 random bytes
- **Usage**: Injected on `<script>/<style>` in CSP header

### CSP Header Builder
- **Function**: `buildCspHeader(nonce, context)`
- **Context**: `'editor'` | `'published'`
  - `'editor'`: frame-ancestors 'self' (allow editor iframe)
  - `'published'`: Strict (no iframes)
- **Directives**:
  - `script-src 'nonce-...'`
  - `style-src 'nonce-...' 'unsafe-hashes'`
  - `frame-ancestors 'self'` (editor) or none (published)

### Encryption
- **Path**: `src/formEndpoints/encryptionUtils.ts`
- **Algorithm**: AES-256-GCM
- **Key**: `ENDPOINT_ENCRYPTION_KEY` (64 hex chars = 32 bytes)
- **Functions**:
  - `encrypt(plaintext, key)`: Returns ciphertext + IV + authTag
  - `decrypt(ciphertext, key)`: Returns plaintext or throws

### Rate Limiting
- **Type**: In-memory token buckets
- **Limit**: 10 req/IP/60s
- **Storage**: `_rateBuckets` Map<ip, { tokens, lastRefill }>`
- **Response**: 429 on exceed
- **Cleanup**: Auto-expires old entries

---

## Build & Deploy

### buildSite(site)
- **Purpose**: Generate static HTML for all pages
- **Process**:
  1. Loop `site.pages[]`
  2. For each page, render blocks via `renderBlock()`
  3. Inject styles (scoped per block)
  4. Generate CSP nonce, write to page HTML
  5. Create `.headers.json` sidecar (CSP directive)
  6. Create `_headers` file (Netlify/Cloudflare format)
- **Output**:
  - `pages/[slug]/index.html` (static)
  - `pages/[slug]/.headers.json` (CSP metadata)
  - `_headers` (root, merged CSP rules)
- **Publish**: Triggers on `POST /api/sites/:siteId/publish`

### invalidateProductCache
- **Path**: `src/products/invalidateCache.ts`
- **Purpose**: Clear ISR cache after product update
- **Logic**:
  1. POST to `${RUNTIME_URL}/_nitro/cache/clear`
  2. Include `x-cache-purge-key` header
  3. Silently skip if env vars missing
- **Env Vars**: `RUNTIME_URL`, `CACHE_PURGE_SECRET`

---

## Environment Variables

### LLM Configuration
- `LLM_PROVIDER`: 'openai' | 'anthropic' | 'ollama'
- `LLM_BASE_URL`: (optional, for Ollama)
- `LLM_MODEL`: Model name (e.g., 'gpt-4-turbo', 'claude-3-5-sonnet')
- `LLM_API_KEY`: API key

### Database
- `DATABASE_URL`: PostgreSQL connection string (postgresql://user:pass@host/db)

### Endpoints & Security
- `ENDPOINT_ENCRYPTION_KEY`: 64 hex chars (32 bytes) for form endpoint encryption
- `SESSION_SECRET`: Random string for session signing
- `RUNTIME_URL`: URL of Nuxt runtime app (for ISR cache purge)
- `CACHE_PURGE_SECRET`: Secret for cache purge requests

### Collaboration
- `WS_URL`: WebSocket server URL (for Yjs)

---

## Testing
- **Path**: `src/__tests__/`
- **Files**:
  - `pageGenerator.test.ts`: 8 tests (URL, screenshot, HTML generation)
  - Total: 8 passing tests
- **Run**: `npm test`

---

## Performance & Scaling

### Database
- Connection pooling: `pg.Pool` (default 10 connections)
- Indexes on: site_id, slug, (site_id, slug) UNIQUE
- JSONB queries efficient (native Postgres JSONB operators)

### Caching
- Yjs snapshots cached in Postgres `collab_state`
- Product cache invalidated via ISR purge (runtime)
- No in-memory caches (shared state via DB)

### Async Processing
- SSE streaming for long-running operations (page generation, AI prompt)
- Allows client to abort mid-stream
- No background queues (Express handles inline)

---

## Key Dependencies
```json
{
  "dependencies": {
    "express": "^4.x",
    "pg": "^8.x (Postgres client, NOT in pnpm-workspace)",
    "yjs": "^13.x (CRDT, NOT in pnpm-workspace)",
    "y-websocket": "^1.x",
    "puppeteer": "^21.x (Chromium automation)",
    "isomorphic-dompurify": "^2.x (HTML sanitizer)",
    "jsdom": "^23.x (DOM parsing)",
    "crypto": "built-in (AES-256-GCM)"
  }
}
```

## Important Notes
- **No pnpm workspace sync**: Install `node-build-server` deps manually (`npm install --ignore-scripts`)
- **tsconfig**: `moduleResolution: "bundler"` for Yjs subpath exports; keep `module: "CommonJS"`
- **Cannot import from @cms/contracts**: Mirror types locally in `node-build-server` due to CJS/ESM boundary
- **Puppeteer cache**: Located at `~/.cache/puppeteer/`, ensure write permissions
