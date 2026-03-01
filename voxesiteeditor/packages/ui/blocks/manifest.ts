/**
 * Block Manifest — SINGLE registration point for all page blocks.
 *
 * Adding a new block requires only:
 *   1. Create the TypeScript types in packages/contracts/blocks/
 *   2. Create the block schema in packages/ui/schemas/blocks/
 *   3. Create the Vue component in packages/ui/components/
 *   4. Add ONE entry here.
 *
 * The manifest automatically feeds:
 *   - Renderer registry in renderComponent.ts
 *   - BlockSchemas in schemas/index.ts
 *   - "Add block" menu in apps/editor/pages/index.vue
 *   - LLM schema context in apps/editor/server/api/ai-prompt.post.ts
 *
 * NOTE: Layout blocks (LayoutHeader, LayoutFooter) are NOT listed here —
 * they live in LayoutSchemas (schemas/index.ts) and are rendered via
 * renderLayoutBlock(). The Composite type is also excluded because it is
 * resolved inline in renderBlock() before any registry lookup.
 */

import { defineBlockManifest } from './defineBlock'

// ── Components ───────────────────────────────────────────────────────────────
import Hero from '../components/Hero.vue'
import TextBlock from '../components/TextBlock.vue'
import FormBlock from '../components/FormBlock.vue'
import CardGrid from '../components/CardGrid.vue'
import ImageGallery from '../components/ImageGallery.vue'
import CTABanner from '../components/CTABanner.vue'
import Testimonials from '../components/Testimonials.vue'
import Features from '../components/Features.vue'
import PricingTable from '../components/PricingTable.vue'
import FAQ from '../components/FAQ.vue'
import ContactInfo from '../components/ContactInfo.vue'

// ── Schemas ──────────────────────────────────────────────────────────────────
import { HeroSchema } from '../schemas/blocks/hero.schema'
import { TextBlockSchema } from '../schemas/blocks/text.schema'
import { FormSchema } from '../schemas/blocks/form.schema'
import { CardGridSchema } from '../schemas/blocks/cardGrid.schema'
import { ImageGallerySchema } from '../schemas/blocks/imageGallery.schema'
import { CTABannerSchema } from '../schemas/blocks/ctaBanner.schema'
import { TestimonialsSchema } from '../schemas/blocks/testimonials.schema'
import { FeaturesSchema } from '../schemas/blocks/features.schema'
import { PricingTableSchema } from '../schemas/blocks/pricingTable.schema'
import { FAQSchema } from '../schemas/blocks/faq.schema'
import { ContactInfoSchema } from '../schemas/blocks/contactInfo.schema'

// ── Style schemas ─────────────────────────────────────────────────────────────
import { ColorStylesSchema } from '../schemas/styles/colors.schema'
import { TypographyStylesSchema } from '../schemas/styles/typography.schema'
import { SpacingStylesSchema } from '../schemas/styles/spacing.schema'

// ── Manifest ──────────────────────────────────────────────────────────────────
export const BlockManifest = [
  // ── Existing blocks ─────────────────────────────────────────────────────────
  defineBlockManifest({
    type: 'Hero',
    label: 'Hero',
    icon: '🦸',
    category: 'content',
    schema: HeroSchema as any,
    component: Hero,
    styleSchemas: [ColorStylesSchema, TypographyStylesSchema, SpacingStylesSchema]
  }),

  defineBlockManifest({
    type: 'TextBlock',
    label: 'Texto',
    icon: '📝',
    category: 'content',
    schema: TextBlockSchema as any,
    component: TextBlock,
    styleSchemas: [ColorStylesSchema, TypographyStylesSchema]
  }),

  defineBlockManifest({
    type: 'FormBlock',
    label: 'Formulario',
    icon: '📋',
    category: 'utility',
    schema: FormSchema as any,
    component: FormBlock,
    styleSchemas: [ColorStylesSchema, SpacingStylesSchema]
  }),

  // ── Tier 1 blocks ────────────────────────────────────────────────────────────
  defineBlockManifest({
    type: 'CardGrid',
    label: 'Tarjetas',
    icon: '🗃️',
    category: 'content',
    schema: CardGridSchema as any,
    component: CardGrid,
    styleSchemas: [ColorStylesSchema]
  }),

  defineBlockManifest({
    type: 'ImageGallery',
    label: 'Galería',
    icon: '🖼️',
    category: 'content',
    schema: ImageGallerySchema as any,
    component: ImageGallery,
    styleSchemas: [ColorStylesSchema]
  }),

  defineBlockManifest({
    type: 'CTABanner',
    label: 'Banner CTA',
    icon: '📢',
    category: 'marketing',
    schema: CTABannerSchema as any,
    component: CTABanner,
    styleSchemas: [ColorStylesSchema]
  }),

  defineBlockManifest({
    type: 'Testimonials',
    label: 'Testimonios',
    icon: '💬',
    category: 'marketing',
    schema: TestimonialsSchema as any,
    component: Testimonials,
    styleSchemas: [ColorStylesSchema]
  }),

  defineBlockManifest({
    type: 'Features',
    label: 'Características',
    icon: '⭐',
    category: 'content',
    schema: FeaturesSchema as any,
    component: Features,
    styleSchemas: [ColorStylesSchema]
  }),

  defineBlockManifest({
    type: 'PricingTable',
    label: 'Precios',
    icon: '💰',
    category: 'marketing',
    schema: PricingTableSchema as any,
    component: PricingTable,
    styleSchemas: [ColorStylesSchema]
  }),

  defineBlockManifest({
    type: 'FAQ',
    label: 'Preguntas frecuentes',
    icon: '❓',
    category: 'content',
    schema: FAQSchema as any,
    component: FAQ,
    styleSchemas: [ColorStylesSchema]
  }),

  defineBlockManifest({
    type: 'ContactInfo',
    label: 'Contacto',
    icon: '📞',
    category: 'utility',
    schema: ContactInfoSchema as any,
    component: ContactInfo,
    styleSchemas: [ColorStylesSchema]
  })
]

/**
 * Lookup map for fast component resolution — built from the manifest at module load.
 * Used by renderComponent.ts to avoid iterating the array on every renderBlock() call.
 */
export const BlockRegistry: Record<string, any> = Object.fromEntries(
  BlockManifest.map(entry => [entry.type, entry.component])
)
