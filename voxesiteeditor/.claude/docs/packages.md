# Packages (@cms)

## Package Structure
```
packages/
  ├─ contracts/      (TypeScript types, interfaces)
  ├─ ui/             (Vue components, schemas, renderer, block registry)
  └─ utils/          (CSS generation, utilities)
```

---

## contracts Package

### Purpose
Shared TypeScript types, enums, interfaces used across editor, runtime, and backend.

### Key Files & Types

#### blocks.ts
- **Type**: `Block` interface (base)
  - `id`: Unique identifier
  - `type`: Block type (string)
  - `props`: Block-specific properties (Record<string, any>)
  - `styles`: CSS overrides per selector (Record<selector, Record<property, value>>)
  - `order`: Render position in page
- **Type**: `FormBlock` (extends Block)
  - `fields`: FormField[] array
  - `successMessage`: String after form submit
  - `endpointKey`: Optional encrypted endpoint reference
- **Type**: `FormField`
  - `id`, `label`, `type` (FieldType), `required`, `placeholder`
  - `validation`: Pattern/min/max for email/cedula/NIT/phone
  - `conditions`: FieldCondition[] for conditional visibility/required
- **Type**: `FieldCondition`
  - `fieldId`, `operator` ('equals'|'contains'), `value`
  - `action` ('show'|'hide'|'require')
- **Enum**: `FieldType` ('text'|'email'|'phone'|'select'|'checkbox'|'textarea'|'cedula'|'nit')
- **Type**: `Page`
  - `id`, `slug`, `title`, `blocks[]`, `metadata?`
- **Type**: `Site`
  - `id`, `name`, `pages[]`, `layout`, `customComponents[]` (Composite definitions)
- **Type**: `CompositeBlockDefinition`
  - `id`, `name`, `blocks[]`, `overrides` (per-instance prop variations)

#### messages.ts
- **Type**: `EditorMessage` (union)
  - `PAGE_UPDATE`: editor→runtime (full page JSON)
  - `LAYOUT_UPDATE`: editor→runtime (layout JSON)
  - `BLOCK_SELECT`: runtime→editor ({ blockId, x, y })
  - `BLOCK_REORDER`: runtime→editor ({ sourceId, targetId })
  - `LAYOUT_BLOCK_SELECT`: runtime→editor ({ slot: 'header'|'footer' })
  - `AI_PATCH`: editor→runtime (Partial<Page>)
  - `PRESENCE_UPDATE`: any→any (UserPresence data)
- **Type**: `UserPresence`
  - `userId`, `userName`, `color`, `selectedBlockId`, `cursorX`, `cursorY`
- **Function**: `sendEditorMessage(message)`: PostMessage wrapper
- **Function**: `isEditorMessage(obj)`: Type guard

#### presence.ts
- **Function**: `presenceColorFromId(userId)`: HSL hash from ID
  - Returns: `hsl(H, 65%, 50%)`
  - Deterministic, unique per user ID

#### product.ts
- **Type**: `Product`
  - `id`, `slug`, `title`, `description`, `price`, `stock`, `category`, `image`, `metadata?`

---

## ui Package

### Purpose
Vue components, block schemas, render logic, block registry.

### Directory Structure
```
ui/
  ├─ components/        (Vue components)
  ├─ blocks/            (Block registry manifests)
  ├─ schemas/           (Block & layout schemas)
  ├─ renderer/          (renderBlock, renderLayoutBlock)
  ├─ composables/       (useFormConditions, useFormValidation)
  └─ index.ts           (re-exports)
```

### Block Registry (`blocks/manifest.ts`)

**Purpose**: Single source of truth for all page blocks.

**Structure**:
```typescript
defineBlockManifest([
  { type: 'Hero', schema: HeroSchema, component: () => Hero },
  { type: 'Features', schema: FeaturesSchema, component: () => Features },
  // ... 34 blocks total
])
```

**Auto-Derived**:
- `BlockRegistry`: Object<type, VNode renderer> (used by renderBlock)
- `BlockSchemas`: Object<type, BlockSchema> (used by BlockEditorPanel)

**Note**: Layout blocks (LayoutHeader, LayoutFooter) NOT in manifest.

### Renderer (`renderer/renderComponent.ts`)

#### renderBlock(blocks[], options)
- **Purpose**: Convert block JSON to Vue VNodes
- **Logic**:
  1. Check if `type === 'Composite'`
  2. Resolve from `options.site.customComponents[]`
  3. Render children recursively
  4. Merge per-instance overrides
- **Fallback**: Registry lookup if not Composite
- **Options**: `{ nonce?, site? }`
  - `nonce`: Injected on dynamic styles
  - `site`: Resolves Composite definitions
- **Returns**: Vue `h()` VNode tree

#### renderLayoutBlock(layout)
- **Purpose**: Render header/footer blocks
- **Logic**: Match block type to LayoutRegistry (LayoutHeader, LayoutFooter)
- **Returns**: Vue VNode

### Schemas

#### Block Schemas
- **Path**: `schemas/blocks/`
- **Files**:
  - `hero.schema.ts`: HeroSchema (title, subtitle, image, CTA button)
  - `features.schema.ts`: FeaturesSchema (feature items array)
  - `cardGrid.schema.ts`: CardGrid schema (cards array, columns)
  - `form.schema.ts`: FormSchema (form fields array, validation)
  - (34 total block schemas)

#### Layout Schemas
- **Path**: `schemas/layout/`
- **Files**:
  - `header.schema.ts`: HeaderSchema (logo, menu links, mobile hamburger)
  - `footer.schema.ts`: FooterSchema (footer columns, social links)

#### Style Schemas
- **Path**: `schemas/styles/`
- **Includes**:
  - `typography.schema.ts`: TypographyStylesSchema (font-size, weight, text-align, color)
  - `color.schema.ts`: ColorStylesSchema (background, text color)
  - `spacing.schema.ts`: SpacingStylesSchema (padding, margin)
  - `grid.schema.ts`: GridStylesSchema (grid-column, grid-row, gap)
  - (composite style schemas for all 34 blocks)

### Schema Structure
```typescript
{
  key: 'fieldKey',
  label: 'Display Label',
  type: 'string'|'number'|'boolean'|'color'|'align'|'array'|'json'|'css',
  default?: value,
  subfields?: SubfieldDef[], // for type: 'array'
  options?: { label, value }[] // for type: 'select'
}
```

### Component Examples

#### Hero.vue
- **Props**: `title`, `subtitle`, `image`, `ctaText`, `ctaLink`, `styles`
- **Renders**: Image background, centered text, CTA button
- **Responsive**: Mobile-first CSS

#### Features.vue
- **Props**: `features` (array), `columns`, `styles`
- **Renders**: Grid of feature items
- **Structure**: Feature item = { icon, title, description }

#### FormBlock.vue
- **Props**: `fields` (JSON string or array), `successMessage`, `endpointKey`, `styles`
- **Behavior**:
  - Inject `siteId` (default 'demosite')
  - Validate visible fields only (useFormValidation)
  - POST to `/api/form-submit`
  - Show success message on 2xx
- **Validation**: cedula, NIT, email, pattern, min/max
- **Conditions**: AND logic for show/hide/require (useFormConditions)

#### ProductCard.vue
- **Props**: `product` (Product), `styles`
- **Displays**: Image, title, price, stock status
- **Link**: To `/productos/:slug`

#### ProductGrid.vue
- **Props**: `products` (Product[]), `columns`, `styles`
- **Renders**: ProductCard children
- **Filter**: Optional filter bar (filter by any prop)

#### LayoutHeader.vue
- **Props**: `logo`, `links` (array), `cta` (CTA button), `styles`
- **Responsive**: Mobile hamburger menu
- **Mobile breakpoint**: `max-width: 768px`

#### LayoutFooter.vue
- **Props**: `columns` (array), `socialLinks`, `copyright`, `styles`
- **Structure**: Footer column layout, social icons

### Composables

#### useFormConditions
- **Purpose**: Evaluate AND logic for field visibility/required/hidden
- **Function**: `isFieldVisible(field, formValues)` → boolean
- **Logic**: Check all conditions, return AND result

#### useFormValidation
- **Purpose**: Validate form fields
- **Function**: `validateField(field, value)` → { valid, error }
- **Rules**:
  - cedula: `/^\d{6,10}$/`
  - NIT: `/^\d{9}-\d{1}$/`
  - email: `/.+@.+\..+/`
  - phone: `/^\d{7,}$/`
  - pattern: Custom regex
  - min/max: Length/number validation
- **Validates**: Only visible fields

### Style Generation (`utils/css/`)

#### generateBlockCss(block)
- **Purpose**: Create CSS string for block
- **Logic**:
  1. Loop `block.styles` (selectors)
  2. For each selector, merge property-value pairs
  3. Return `.block-{id} selector { properties: values; }`
- **Scope**: `.block-{id}` (unique per block)
- **Import**: From `@cms/utils`

### Block Types (34 Total)

#### Tier 1 (Original)
- Hero, Section, Gallery

#### Tier 2
- CardGrid, ImageGallery, CTABanner, Testimonials, Features, PricingTable, FAQ, ContactInfo

#### Tier 3
- Flyer, VideoEmbed, Countdown, StatsBanner, TeamSection, LogoCloud, Timeline, Breadcrumb
- ProductCard, ProductGrid, ProductDetail, MapEmbed, NewsletterSignup, SearchBar, Accordion, Tabs
- Carousel, Table, CodeBlock, Divider, Spacer, Alert, ProgressBar

### Component Guidelines
- JSON string OR Array prop acceptance
- Mobile-first responsive CSS
- 44×44 px touch targets
- Include `nonce` prop for CSP
- Lazy load images
- No external syntax highlighting libs (CodeBlock uses native)

---

## utils Package

### Purpose
CSS generation, utility functions.

### Key Functions

#### generateBlockCss(block)
- **Path**: `css/index.ts`
- **Input**: Block object with `styles` property
- **Output**: CSS string scoped to `.block-{id}`
- **Usage**: Called by runtime during page render

#### generateBulkCss(blocks[])
- **Purpose**: Batch CSS generation for multiple blocks
- **Returns**: Single CSS string (all blocks combined)

---

## Export Structure

### From `packages/ui/index.ts`
```typescript
export { renderBlock, renderLayoutBlock } from './renderer/renderComponent'
export { BlockSchemas, BlockRegistry } from './blocks/manifest'
export { LayoutSchemas, layoutRegistry } from './renderer/renderComponent'
export * from './schemas'
export * from './components'
```

### From `packages/contracts/index.ts`
```typescript
export type { Block, Page, Site, Product, ... }
export type { EditorMessage, UserPresence, ... }
export { sendEditorMessage, isEditorMessage } from './messages'
export { presenceColorFromId } from './presence'
```

### From `packages/utils/index.ts`
```typescript
export { generateBlockCss, generateBulkCss } from './css'
```

---

## Adding New Page Blocks

**Process** (5 steps):
1. **Type**: Add `Block` subtype in `packages/contracts/blocks/[name].ts`
2. **Schema**: Create schema in `packages/ui/schemas/blocks/[name].schema.ts`
3. **Component**: Create Vue component in `packages/ui/components/[Name].vue`
4. **Manifest**: Add ONE entry to `packages/ui/blocks/manifest.ts`
5. Done (registry + schemas auto-derived)

---

## Testing
- **Blocks**: `blocks.test.ts` (18 Tier 1) + `blocks-tier2-tier3.test.ts` (58 Tier 2/3)
- **Total**: 116 tests passing
- **Coverage**: Component rendering, schema validation, message protocol
