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
// Tier 2
import Flyer from '../components/Flyer.vue'
import VideoEmbed from '../components/VideoEmbed.vue'
import Countdown from '../components/Countdown.vue'
import StatsBanner from '../components/StatsBanner.vue'
import TeamSection from '../components/TeamSection.vue'
import LogoCloud from '../components/LogoCloud.vue'
import Timeline from '../components/Timeline.vue'
import Breadcrumb from '../components/Breadcrumb.vue'
// Tier 3
import ProductCard from '../components/ProductCard.vue'
import ProductGrid from '../components/ProductGrid.vue'
import ProductDetail from '../components/ProductDetail.vue'
import MapEmbed from '../components/MapEmbed.vue'
import NewsletterSignup from '../components/NewsletterSignup.vue'
import SearchBar from '../components/SearchBar.vue'
import Accordion from '../components/Accordion.vue'
import Tabs from '../components/Tabs.vue'
import Carousel from '../components/Carousel.vue'
import Table from '../components/Table.vue'
import CodeBlock from '../components/CodeBlock.vue'
import Divider from '../components/Divider.vue'
import Spacer from '../components/Spacer.vue'
import Alert from '../components/Alert.vue'
import ProgressBar from '../components/ProgressBar.vue'

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
// Tier 2
import { FlyerSchema } from '../schemas/blocks/flyer.schema'
import { VideoEmbedSchema } from '../schemas/blocks/videoEmbed.schema'
import { CountdownSchema } from '../schemas/blocks/countdown.schema'
import { StatsBannerSchema } from '../schemas/blocks/statsBanner.schema'
import { TeamSectionSchema } from '../schemas/blocks/teamSection.schema'
import { LogoCloudSchema } from '../schemas/blocks/logoCloud.schema'
import { TimelineSchema } from '../schemas/blocks/timeline.schema'
import { BreadcrumbSchema } from '../schemas/blocks/breadcrumb.schema'
// Tier 3
import { ProductCardSchema } from '../schemas/blocks/productCard.schema'
import { ProductGridSchema } from '../schemas/blocks/productGrid.schema'
import { ProductDetailSchema } from '../schemas/blocks/productDetail.schema'
import { MapEmbedSchema } from '../schemas/blocks/mapEmbed.schema'
import { NewsletterSignupSchema } from '../schemas/blocks/newsletterSignup.schema'
import { SearchBarSchema } from '../schemas/blocks/searchBar.schema'
import { AccordionSchema } from '../schemas/blocks/accordion.schema'
import { TabsSchema } from '../schemas/blocks/tabs.schema'
import { CarouselSchema } from '../schemas/blocks/carousel.schema'
import { TableSchema } from '../schemas/blocks/table.schema'
import { CodeBlockSchema } from '../schemas/blocks/codeBlock.schema'
import { DividerSchema } from '../schemas/blocks/divider.schema'
import { SpacerSchema } from '../schemas/blocks/spacer.schema'
import { AlertSchema } from '../schemas/blocks/alert.schema'
import { ProgressBarSchema } from '../schemas/blocks/progressBar.schema'

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
  }),

  // ── Tier 2 blocks ────────────────────────────────────────────────────────────
  defineBlockManifest({
    type: 'Flyer',
    label: 'Volante',
    icon: '🪁',
    category: 'marketing',
    schema: FlyerSchema as any,
    component: Flyer,
    styleSchemas: [ColorStylesSchema]
  }),

  defineBlockManifest({
    type: 'VideoEmbed',
    label: 'Video',
    icon: '▶️',
    category: 'content',
    schema: VideoEmbedSchema as any,
    component: VideoEmbed,
    styleSchemas: [SpacingStylesSchema]
  }),

  defineBlockManifest({
    type: 'Countdown',
    label: 'Contador',
    icon: '⏱️',
    category: 'marketing',
    schema: CountdownSchema as any,
    component: Countdown,
    styleSchemas: [ColorStylesSchema]
  }),

  defineBlockManifest({
    type: 'StatsBanner',
    label: 'Estadísticas',
    icon: '📊',
    category: 'marketing',
    schema: StatsBannerSchema as any,
    component: StatsBanner,
    styleSchemas: [ColorStylesSchema]
  }),

  defineBlockManifest({
    type: 'TeamSection',
    label: 'Equipo',
    icon: '👥',
    category: 'content',
    schema: TeamSectionSchema as any,
    component: TeamSection,
    styleSchemas: [ColorStylesSchema]
  }),

  defineBlockManifest({
    type: 'LogoCloud',
    label: 'Logos',
    icon: '🏷️',
    category: 'marketing',
    schema: LogoCloudSchema as any,
    component: LogoCloud,
    styleSchemas: [ColorStylesSchema]
  }),

  defineBlockManifest({
    type: 'Timeline',
    label: 'Línea de tiempo',
    icon: '📅',
    category: 'content',
    schema: TimelineSchema as any,
    component: Timeline,
    styleSchemas: [ColorStylesSchema]
  }),

  defineBlockManifest({
    type: 'Breadcrumb',
    label: 'Migas de pan',
    icon: '🔗',
    category: 'utility',
    schema: BreadcrumbSchema as any,
    component: Breadcrumb,
    styleSchemas: []
  }),

  // ── Tier 3 blocks ────────────────────────────────────────────────────────────
  defineBlockManifest({
    type: 'ProductCard',
    label: 'Tarjeta de producto',
    icon: '🛍️',
    category: 'ecommerce',
    schema: ProductCardSchema as any,
    component: ProductCard,
    styleSchemas: [ColorStylesSchema]
  }),

  defineBlockManifest({
    type: 'ProductGrid',
    label: 'Grilla de productos',
    icon: '🛒',
    category: 'ecommerce',
    schema: ProductGridSchema as any,
    component: ProductGrid,
    styleSchemas: [ColorStylesSchema]
  }),

  defineBlockManifest({
    type: 'ProductDetail',
    label: 'Detalle de producto',
    icon: '📦',
    category: 'ecommerce',
    schema: ProductDetailSchema as any,
    component: ProductDetail,
    styleSchemas: [ColorStylesSchema]
  }),

  defineBlockManifest({
    type: 'MapEmbed',
    label: 'Mapa',
    icon: '🗺️',
    category: 'utility',
    schema: MapEmbedSchema as any,
    component: MapEmbed,
    styleSchemas: []
  }),

  defineBlockManifest({
    type: 'NewsletterSignup',
    label: 'Boletín',
    icon: '📧',
    category: 'marketing',
    schema: NewsletterSignupSchema as any,
    component: NewsletterSignup,
    styleSchemas: [ColorStylesSchema]
  }),

  defineBlockManifest({
    type: 'SearchBar',
    label: 'Buscador',
    icon: '🔍',
    category: 'utility',
    schema: SearchBarSchema as any,
    component: SearchBar,
    styleSchemas: []
  }),

  defineBlockManifest({
    type: 'Accordion',
    label: 'Acordeón',
    icon: '🪗',
    category: 'content',
    schema: AccordionSchema as any,
    component: Accordion,
    styleSchemas: []
  }),

  defineBlockManifest({
    type: 'Tabs',
    label: 'Pestañas',
    icon: '📑',
    category: 'content',
    schema: TabsSchema as any,
    component: Tabs,
    styleSchemas: []
  }),

  defineBlockManifest({
    type: 'Carousel',
    label: 'Carrusel',
    icon: '🎠',
    category: 'content',
    schema: CarouselSchema as any,
    component: Carousel,
    styleSchemas: []
  }),

  defineBlockManifest({
    type: 'Table',
    label: 'Tabla',
    icon: '📊',
    category: 'content',
    schema: TableSchema as any,
    component: Table,
    styleSchemas: []
  }),

  defineBlockManifest({
    type: 'CodeBlock',
    label: 'Código',
    icon: '💻',
    category: 'content',
    schema: CodeBlockSchema as any,
    component: CodeBlock,
    styleSchemas: []
  }),

  defineBlockManifest({
    type: 'Divider',
    label: 'Divisor',
    icon: '➖',
    category: 'utility',
    schema: DividerSchema as any,
    component: Divider,
    styleSchemas: []
  }),

  defineBlockManifest({
    type: 'Spacer',
    label: 'Espacio',
    icon: '↕️',
    category: 'utility',
    schema: SpacerSchema as any,
    component: Spacer,
    styleSchemas: []
  }),

  defineBlockManifest({
    type: 'Alert',
    label: 'Alerta',
    icon: '⚠️',
    category: 'utility',
    schema: AlertSchema as any,
    component: Alert,
    styleSchemas: []
  }),

  defineBlockManifest({
    type: 'ProgressBar',
    label: 'Barra de progreso',
    icon: '📈',
    category: 'utility',
    schema: ProgressBarSchema as any,
    component: ProgressBar,
    styleSchemas: []
  })
]

/**
 * Lookup map for fast component resolution — built from the manifest at module load.
 * Used by renderComponent.ts to avoid iterating the array on every renderBlock() call.
 */
export const BlockRegistry: Record<string, any> = Object.fromEntries(
  BlockManifest.map(entry => [entry.type, entry.component])
)
