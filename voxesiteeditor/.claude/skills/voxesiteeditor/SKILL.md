---
name: voxesiteeditor-context
description: Auto-invoke when working on voxesiteeditor monorepo. 
  Loads when editing Pinia store, Nuxt composables, Vue blocks, 
  node-build-server, or postMessage protocol.
---

# voxesiteeditor Architecture Rules

- All mutations go through `usePageStore` — never mutate state directly
- All postMessage uses `sendEditorMessage()` from `@cms/contracts`
- New blocks: type in `contracts/blocks/`, schema in `ui/schemas/blocks/`,
  component in `ui/components/`, one entry in `manifest.ts`
- Layout props use flat keys (no nested objects)
- Complex arrays use `type: 'json'` in schema