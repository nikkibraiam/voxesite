---
description: Generate reference site JSON examples (sneaker store + courses page) and inject them into agent prompt files. Run once after setting up the agents.
allowed-tools: Read, Write, Edit, Bash, Glob
model: sonnet
---

# Generate Agent Reference Site Examples

## Goal
Create realistic `PageBlock[]` JSON examples for both reference sites used by `VoxeSiteBuilderAgent`.
These will be injected into `.claude/prompts/site-builder-agent.xml` as `{{SNEAKER_STORE_EXAMPLE}}`
and `{{COURSES_PAGE_EXAMPLE}}`.

## Step 1 — Read contracts
- Read `packages/contracts/blocks.ts` to get the real block type names, props, and styles schema.
- Read `packages/contracts/types.ts` (or equivalent) for the `PageBlock` interface.

## Step 2 — Generate sneaker store example
Generate a `PageBlock[]` JSON for a fictional sneaker brand landing page:
- Brand name: "STRIDE" — athletic, modern, bold
- Sections: Navbar, Hero (product hero image + headline), Features (3-col grid), 
  Product highlights (image + text), Social proof / testimonials, CTA banner, Footer
- Use real Tailwind classes for styles
- Use `https://placehold.co/` for all images
- Assign realistic UUIDs (use format: `block-{section}-{index}`)

## Step 3 — Generate courses page example  
Generate a `PageBlock[]` JSON for a personal brand courses landing page:
- Person name: "Alex Rivera" — educator, clean, trustworthy
- Sections: Navbar, Hero (headshot + tagline), About section, 
  Courses grid (3 cards), Student testimonials, Newsletter signup CTA, Footer
- Same style conventions as above

## Step 4 — Inject into prompt file
- Read `.claude/prompts/site-builder-agent.xml`
- Replace `{{SNEAKER_STORE_EXAMPLE}}` with the sneaker store JSON (compact, single-line)
- Replace `{{COURSES_PAGE_EXAMPLE}}` with the courses page JSON (compact, single-line)
- Write the updated file back

## Step 5 — Confirm
Print a summary:
- How many blocks in each example
- Which block types were used
- Confirm the XML file was updated successfully