# Voxesite Editor - Agent Documentation

This directory contains documentation for LLM agents to understand and work with the Voxesite Editor project.

## Document Guide

### _index.md
**For**: Architecture overview, system-wide integration, data flow between components
**Read when**: Starting a new task, need to understand how all pieces fit together, working on cross-project concerns
**Contains**: Project structure, data flows, message protocol, state management patterns, database schema, dependencies

### editor.md
**For**: Editor app (apps/editor) implementation, composables, stores, components, UI logic
**Read when**: Building/fixing editor features, working with Pinia store, editing UI behavior, adding editor controls
**Contains**: Entry point, composables (usePageEditor, useCollaboration, etc.), components, Pinia store structure, server routes, message flow

### runtime.md
**For**: Runtime app (apps/runtime) implementation, SSR rendering, page routes, CSP security
**Read when**: Fixing rendering issues, working with SSR, product pages, cache invalidation, security headers
**Contains**: Entry points, routing, rendering pipeline, composables, components, middleware, ISR configuration, error handling

### packages.md
**For**: Shared packages (@cms/contracts, @cms/ui, @cms/utils), block registry, schemas, renderer
**Read when**: Adding new blocks, modifying schemas, working with block types, component structure, manifest system
**Contains**: Package structure, block registry, renderer logic, schemas, components, style generation, block guidelines

### node-backend.md
**For**: Backend (node-build-server) implementation, API routes, services, database, security
**Read when**: Building/fixing APIs, database queries, form endpoints, page generation, AI features, authentication
**Contains**: Server setup, database schema, services, API routes, LLM adapters, build process, security (CSP, encryption, rate limiting)

## How Agents Use These Docs

1. **Understanding the task**: Read `_index.md` to see how everything fits
2. **Locate the right file**: Use specific doc (editor.md, runtime.md, etc.)
3. **Implementation**: Find the relevant composable/component/route/service
4. **Key info**: Look for:
   - `Path`: Where the file is located
   - `Purpose`: What it does
   - `Functions`/`Props`: API signature
   - `State`: What data it manages
   - `Behavior`: How it works

## Document Format

Each document follows this structure:
- **Compact, LLM-optimized** (minimize tokens)
- **Explicit section headers** (easy to parse)
- **Concise descriptions** (no fluff)
- **Key details only** (paths, APIs, important logic)
- **English** (for broad LLM compatibility)

## Integration Example

**Task**: "Add a new color field to the Hero block"

1. Read `_index.md` section "Block Registry System" (understand the flow)
2. Read `packages.md` section "Adding New Page Blocks" (process)
3. Find `packages/ui/schemas/blocks/hero.schema.ts` (add color field)
4. Update `packages/ui/components/Hero.vue` (use the color prop)
5. Update `packages/ui/blocks/manifest.ts` (already done if following process)
6. Done (schema auto-generated)

## When Updating Docs

- Update relevant doc when new features are added
- Keep format consistent (compact, LLM-focused)
- Include file paths, functions, and behavior
- Document breaking changes immediately
- Link between docs where dependencies exist
