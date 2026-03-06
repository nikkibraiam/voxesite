---
description: Fix all 5 active bugs in voxesiteeditor. Run from project root.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

# Fix Active Bugs — voxesiteeditor

## Pre-flight (do this first, no exceptions)
1. Read `CLAUDE.md` — understand current monorepo structure and Bug Fix Log.
2. Run `grep -r "supportsTextColor\|GridBlock\|TextAlign\|SiteCloneAgent\|SiteBuilderAgent" packages/contracts/` to map existing types.
3. Read `packages/contracts/blocks.ts` (or equivalent) to get the full block registry.

---

## BUG-FIX-01 · Generate Page with AI — use VoxeSiteCloneAgent

**Problem:** "Generate Page" button sends URL directly to LLM with no structure.

**Fix:**
- Create `packages/ai-adapters/src/agents/VoxeSiteCloneAgent.ts`
- Load the agent base prompt from `.claude/prompts/site-clone-agent.xml`
- Inject block registry from `packages/contracts/blocks.ts` at runtime into the `{{BLOCK_REGISTRY}}` placeholder
- Flow: URL input → scrape/analyze → map sections to blocks → return `PageBlock[]`
- Expose `useSiteCloneAgent()` composable in `packages/editor/src/composables/`
- Wire the "Generate Page" button to call `useSiteCloneAgent()` instead of raw LLM call

---

## BUG-FIX-02 · AI Panel — use VoxeSiteBuilderAgent with full schema context

**Problem:** AI Panel calls LLM without block schema knowledge.

**Fix:**
- Create `packages/ai-adapters/src/agents/VoxeSiteBuilderAgent.ts`
- Load base prompt from `.claude/prompts/site-builder-agent.xml`
- Inject block registry + example sites (sneaker store + courses page) into placeholders at composable init
- The agent must return **only valid JSON** (`PageBlock[]`) — wrap in safe parser with error recovery
- Expose `useSiteBuilderAgent()` and connect to AI Panel submit action

---

## BUG-FIX-03 · Text alignment controls missing in style panel

**Problem:** No left/center/right/justify controls in the block editor panel.

**Fix:**
- Add `TextAlignControl` component to `packages/editor/src/components/panels/`
- 4 icon toggle buttons: `text-left` | `text-center` | `text-right` | `text-justify` (use Lucide icons)
- Store as `block.styles.textAlign`, apply Tailwind class on render
- Show this control for all blocks where `supportsTextAlign: true` in contract
- Add `supportsTextAlign: boolean` to block contract interface + backfill all text-bearing blocks

---

## BUG-FIX-04 · Grid — explicit cell positioning per component

**Problem:** GridBlock places components sequentially; no manual row/column control.

**Fix:**
- Add `gridColumn` and `gridRow` to block `styles` schema in contracts
- On `GridBlock`, expose column/row/gap config in the style editor
- When dragging a block *inside* a GridBlock, highlight target cell before drop (CSS outline on hover)
- Apply position as inline CSS: `{ grid-column: X / Y, grid-row: X / Y }` on the runtime renderer
- Update `GridBlock` in block library to read and apply these new style props

---

## BUG-FIX-05 · Text color applies only to TextBlock — must work for all text-bearing blocks

**Problem:** `styles.color` only works on `TextBlock`.

**Fix:**
- Add `supportsTextColor: boolean` to block contract interface
- Audit and backfill all blocks that render text content (HeroBlock, CardBlock, ButtonBlock, HeadingBlock, etc.)
- Ensure each block applies `styles.color` to the **text element**, not the wrapper div
- Show the color picker in the style panel conditionally: `v-if="block.contract.supportsTextColor"`

---

## After all fixes
- Update `CLAUDE.md` Bug Fix Log — add BUG-FIX-01 through BUG-FIX-05 with one-line description and affected files
- Run `pnpm typecheck` and `pnpm test` — fix any regressions before finishing