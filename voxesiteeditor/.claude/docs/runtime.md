# Runtime Application (apps/runtime)

## Entry Point
- **Path**: `apps/runtime/app.vue`
- **Type**: Root layout component
- **Port**: 3001 (SSR)
- **Build**: Static generation + ISR (Incremental Static Regeneration)

## Routing

### Page Routes
- `[slug].vue`: Renders individual pages from `GET /api/demosite/site`
- `productos/[slug].vue`: Product detail page (ISR 3600s), includes Schema.org JSON-LD
- `categorias/[slug].vue`: Product category page (ISR 3600s)
- `blog/[slug].vue`: Blog post page (ISR 86400s)

### Route Config (nuxt.config.ts)
```
routeRules:
  /productos/** → isr: 3600
  /categorias/** → isr: 3600
  /blog/** → isr: 86400
  /checkout/** → ssr: true (always dynamic)
  static pages → prerender: true
crawlLinks: true
payloadExtraction: true
```

## Page Rendering

### [slug].vue (Generic Page)
- **Fetch**: `useAsyncData('page-${slug}')` → `GET /api/demosite/site`
- **Render**: Loop `site.pages[]`, match `currentPage.slug`
- **Data**: JSON page structure passed to `renderBlock()`
- **Nonce**: Injected via `useCspNonce()` for CSP compliance

### productos/[slug].vue (Product Detail)
- **Fetch**: `useAsyncData('product-${slug}')` → `GET /api/demosite/products/:slug`
- **Schema.org**: JSON-LD `@type: Product` with price, stock, image
- **Stock Display**: Conditional render (InStock/OutOfStock)
- **Related**: Query `?relatedCategory=X` to fetch similar products

### categorias/[slug].vue (Category Page)
- **Fetch**: `useAsyncData('category-${slug}')` → `GET /api/demosite/products/category/:catSlug`
- **Grid**: Render `ProductCard` components for each product
- **Filter**: Optional query params to filter by price/size

## Composables

### useCspNonce
- **Path**: `apps/runtime/composables/useCspNonce.ts`
- **Purpose**: Retrieve nonce for CSP
- **Logic**: Read from SSR context (`event.context.cspNonce`) or client-side `<meta name="csp-nonce">`
- **Returns**: `{ nonce: string }`

### useRuntimeConfig
- **Purpose**: Access public config
- **Usage**: `const siteId = useRuntimeConfig().public.siteId ?? 'demosite'`
- **Note**: Env vars prefixed with `NUXT_PUBLIC_` exposed to client

## Middleware

### csp.ts
- **Path**: `apps/runtime/server/middleware/csp.ts`
- **Purpose**: Generate nonce per SSR request, set CSP header
- **Logic**:
  - Detect editor mode: `?editor=1` query param or Referer `:3000`
  - Generate nonce via `generateNonce()`
  - Set frame-ancestors: `'self'` in editor mode, strict otherwise
  - Store nonce on `event.context.cspNonce`
- **Fallback**: `<meta http-equiv="CSP">` for client-side

## Components

### SelectableBlock
- **Path**: `apps/runtime/components/SelectableBlock.vue`
- **Purpose**: Wrapper for editable blocks (when `?editor=1`)
- **Props**:
  - `blockId`: Block identifier
  - `enableDrag`: Boolean (false by default, true in runtime preview)
  - `peer`: UserPresence object for multi-user awareness
- **Behavior**:
  - On click: `postMessage(BLOCK_SELECT, { blockId, x, y })`
  - On drag: Fires `BLOCK_REORDER` message for drag-and-drop reordering
  - Peer color border: `.block-peer { border-left: 3px solid var(--peer-color) }`
- **Note**: Cross-document iframe, no SortableJS (HTML5 drag instead)

## Rendering Pipeline

### Page Render Flow
1. Fetch full site: `GET /api/demosite/site`
2. Find matching page by slug
3. Call `renderBlock(page.blocks[], { nonce, site })`
4. Renderer returns Vue `h()` calls (tree of VNodes)
5. Each block wrapped in `SelectableBlock` (if editor mode)
6. Styles injected via `regenerateStyles()` with nonce

### regenerateStyles()
- **Purpose**: Generate dynamic block styles with CSP nonce
- **Logic**: For each block, call `generateBlockCss()`, create `<style nonce="...">`, append to DOM
- **Scope**: `.block-{id}` selector for scoping
- **Called**: On mount + watch `site` changes

### renderBlock() Options
- **Path**: `packages/ui/renderer/renderComponent.ts`
- **Signature**: `renderBlock(block, { nonce?, site? })`
- **Purpose**:
  - `nonce`: Injected on dynamic `<style>` tags
  - `site`: Resolves Composite block definitions from `site.customComponents[]`

## State Management

### useAsyncData Keys
- Unique per route to prevent cache collision
- Examples: `'product-${slug}'`, `'category-${slug}'`, `'page-${slug}'`
- **Important**: Reuse same key if route param unchanged (prevents refetch)

### useHead Hook
- **Purpose**: Inject `<meta name="csp-nonce">` for client-side access
- **Called**: In each page component
- **Client-side access**: `document.querySelector('meta[name="csp-nonce"]')?.content`

## Message Protocol (Editor Mode)

### Incoming Messages
- `PAGE_UPDATE`: Full page JSON, triggers `regenerateStyles()`
- `LAYOUT_UPDATE`: Layout header/footer change
- `AI_PATCH`: Partial page update (Partial<Page>), merged with current

### Outgoing Messages
- `BLOCK_SELECT`: Clicked block (blockId, x, y coordinates)
- `BLOCK_REORDER`: Dragged block (sourceId, targetId)
- `LAYOUT_BLOCK_SELECT`: Clicked layout block (slot: 'header'|'footer')

### Message Listener
- **Trigger**: `window.parent.postMessage()` from editor iframe
- **Validation**: `isEditorMessage()` type guard
- **Handler**: Switch on `message.type`, update state/DOM accordingly

## Security (CSP & Nonce)

### Nonce Generation
- **Path**: `node-build-server/src/security/nonceGenerator.ts`
- **Type**: Base64url, per-request unique
- **Format**: `generateNonce()` → 16 random bytes → base64url

### CSP Header
- **Built**: `buildCspHeader(nonce, context)` in middleware
- **Directives**:
  - `script-src 'nonce-...'` (no unsafe-inline)
  - `style-src 'nonce-...' 'unsafe-hashes'` (for dynamic styles)
  - `frame-ancestors 'self'` (in editor mode) or strict (production)
- **Fallback**: `<meta http-equiv="CSP">` if middleware skipped

### Dynamic Styles
- All `<style>` tags created in `regenerateStyles()` include nonce attribute
- Never use `unsafe-inline` or `unsafe-eval`
- No duplicate nonces per request
- Nonces not logged in access logs

## Environment Config

### Public Config (Exposed to Client)
- `public.siteId`: Site ID (default 'demosite')
- `public.apiBase`: Backend URL (default '/api')

### Private Config (Server-side Only)
- `DATABASE_URL`: Postgres connection string
- `SESSION_SECRET`: For session signing

## Performance Tuning

### ISR Configuration
- Product pages: 3600s (1 hour) revalidation
- Category pages: 3600s (1 hour) revalidation
- Blog posts: 86400s (24 hours) revalidation
- Static pages: Prerendered at build time

### Caching
- Payload extraction: Enabled (`payloadExtraction: true`)
- Link crawling: Enabled (`crawlLinks: true`)
- Incremental: Fast re-renders on ISR revalidation

### Asset Optimization
- Images: Lazy load + responsive sizing
- CSS: Scoped per block, minified
- JS: Code-split per route (default Nuxt behavior)

## Database Queries
- Product fetch: `SELECT * FROM products WHERE site_id = $1 AND slug = $2`
- Category fetch: `SELECT * FROM products WHERE site_id = $1 AND category = $2`
- No ORM, raw pg queries via `node-build-server` routes

## Error Handling
- Page not found: `createError({ statusCode: 404 })`
- Product missing: Fallback to category or home page
- SSR errors: Caught by Nuxt error boundary, fallback to client render

## Testing
- No unit tests in runtime (mostly template + composable calls)
- Integration tests in `node-build-server` for API routes
