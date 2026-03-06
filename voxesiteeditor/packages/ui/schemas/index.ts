/**
 * BlockSchemas — schema registry for all page blocks.
 *
 * Imports schema files directly (NOT via manifest.ts) so this module is
 * safe to import in Nitro server routes, which are bundled by Rollup without
 * the Vue plugin and cannot process .vue files.
 *
 * The manifest (packages/ui/blocks/manifest.ts) imports these same schemas
 * alongside Vue components for the client-side renderer.
 */

// ── Block schemas ─────────────────────────────────────────────────────────────
import { HeroSchema } from './blocks/hero.schema'
import { TextBlockSchema } from './blocks/text.schema'
import { FormSchema } from './blocks/form.schema'
import { CardGridSchema } from './blocks/cardGrid.schema'
import { ImageGallerySchema } from './blocks/imageGallery.schema'
import { CTABannerSchema } from './blocks/ctaBanner.schema'
import { TestimonialsSchema } from './blocks/testimonials.schema'
import { FeaturesSchema } from './blocks/features.schema'
import { PricingTableSchema } from './blocks/pricingTable.schema'
import { FAQSchema } from './blocks/faq.schema'
import { ContactInfoSchema } from './blocks/contactInfo.schema'
// Tier 2
import { FlyerSchema } from './blocks/flyer.schema'
import { VideoEmbedSchema } from './blocks/videoEmbed.schema'
import { CountdownSchema } from './blocks/countdown.schema'
import { StatsBannerSchema } from './blocks/statsBanner.schema'
import { TeamSectionSchema } from './blocks/teamSection.schema'
import { LogoCloudSchema } from './blocks/logoCloud.schema'
import { TimelineSchema } from './blocks/timeline.schema'
import { BreadcrumbSchema } from './blocks/breadcrumb.schema'
// Tier 3
import { ProductCardSchema } from './blocks/productCard.schema'
import { ProductGridSchema } from './blocks/productGrid.schema'
import { ProductDetailSchema } from './blocks/productDetail.schema'
import { MapEmbedSchema } from './blocks/mapEmbed.schema'
import { NewsletterSignupSchema } from './blocks/newsletterSignup.schema'
import { SearchBarSchema } from './blocks/searchBar.schema'
import { AccordionSchema } from './blocks/accordion.schema'
import { TabsSchema } from './blocks/tabs.schema'
import { CarouselSchema } from './blocks/carousel.schema'
import { TableSchema } from './blocks/table.schema'
import { CodeBlockSchema } from './blocks/codeBlock.schema'
import { DividerSchema } from './blocks/divider.schema'
import { SpacerSchema } from './blocks/spacer.schema'
import { AlertSchema } from './blocks/alert.schema'
import { ProgressBarSchema } from './blocks/progressBar.schema'
// Special
import { CompositeSchema } from './blocks/composite.schema'

// ── Layout schemas ────────────────────────────────────────────────────────────
import { HeaderSchema } from './layout/header.schema'
import { FooterSchema } from './layout/footer.schema'

// ── Style schemas ─────────────────────────────────────────────────────────────
import { ColorStylesSchema } from './styles/colors.schema'
import { TypographyStylesSchema } from './styles/typography.schema'
import { SpacingStylesSchema } from './styles/spacing.schema'
import { GridStylesSchema } from './styles/grid.schema'

/**
 * BlockSchemas — keyed by block type.
 * Shape: { content: BlockSchema, styles: StyleSchema[] }
 *
 * Style arrays mirror the styleSchemas defined in manifest.ts so that
 * BlockEditorPanel renders the same style controls on both client and server.
 */
export const BlockSchemas: Record<string, any> = {
  // ── Original blocks ───────────────────────────────────────────────────────
  Hero:        { content: HeroSchema,        styles: [ColorStylesSchema, TypographyStylesSchema, SpacingStylesSchema] },
  TextBlock:   { content: TextBlockSchema,   styles: [ColorStylesSchema, TypographyStylesSchema, SpacingStylesSchema] },
  FormBlock:   { content: FormSchema,        styles: [ColorStylesSchema, SpacingStylesSchema] },

  // ── Tier 1 ────────────────────────────────────────────────────────────────
  CardGrid:      { content: CardGridSchema,      styles: [ColorStylesSchema, TypographyStylesSchema, GridStylesSchema] },
  ImageGallery:  { content: ImageGallerySchema,  styles: [ColorStylesSchema, SpacingStylesSchema] },
  CTABanner:     { content: CTABannerSchema,     styles: [ColorStylesSchema, TypographyStylesSchema] },
  Testimonials:  { content: TestimonialsSchema,  styles: [ColorStylesSchema, TypographyStylesSchema] },
  Features:      { content: FeaturesSchema,      styles: [ColorStylesSchema, TypographyStylesSchema, GridStylesSchema] },
  PricingTable:  { content: PricingTableSchema,  styles: [ColorStylesSchema, TypographyStylesSchema] },
  FAQ:           { content: FAQSchema,           styles: [ColorStylesSchema, TypographyStylesSchema] },
  ContactInfo:   { content: ContactInfoSchema,   styles: [ColorStylesSchema, TypographyStylesSchema] },

  // ── Tier 2 ────────────────────────────────────────────────────────────────
  Flyer:       { content: FlyerSchema,       styles: [ColorStylesSchema, TypographyStylesSchema] },
  VideoEmbed:  { content: VideoEmbedSchema,  styles: [SpacingStylesSchema] },
  Countdown:   { content: CountdownSchema,   styles: [ColorStylesSchema, TypographyStylesSchema] },
  StatsBanner: { content: StatsBannerSchema, styles: [ColorStylesSchema, TypographyStylesSchema] },
  TeamSection: { content: TeamSectionSchema, styles: [ColorStylesSchema, TypographyStylesSchema, GridStylesSchema] },
  LogoCloud:   { content: LogoCloudSchema,   styles: [ColorStylesSchema, SpacingStylesSchema] },
  Timeline:    { content: TimelineSchema,    styles: [ColorStylesSchema, TypographyStylesSchema] },
  Breadcrumb:  { content: BreadcrumbSchema,  styles: [ColorStylesSchema, TypographyStylesSchema] },

  // ── Tier 3 ────────────────────────────────────────────────────────────────
  ProductCard:      { content: ProductCardSchema,      styles: [ColorStylesSchema, TypographyStylesSchema] },
  ProductGrid:      { content: ProductGridSchema,      styles: [ColorStylesSchema, GridStylesSchema] },
  ProductDetail:    { content: ProductDetailSchema,    styles: [ColorStylesSchema, TypographyStylesSchema] },
  MapEmbed:         { content: MapEmbedSchema,         styles: [SpacingStylesSchema] },
  NewsletterSignup: { content: NewsletterSignupSchema, styles: [ColorStylesSchema, TypographyStylesSchema] },
  SearchBar:        { content: SearchBarSchema,        styles: [ColorStylesSchema, SpacingStylesSchema] },
  Accordion:        { content: AccordionSchema,        styles: [ColorStylesSchema, TypographyStylesSchema] },
  Tabs:             { content: TabsSchema,             styles: [ColorStylesSchema, TypographyStylesSchema] },
  Carousel:         { content: CarouselSchema,         styles: [ColorStylesSchema, TypographyStylesSchema] },
  Table:            { content: TableSchema,            styles: [ColorStylesSchema, TypographyStylesSchema] },
  CodeBlock:        { content: CodeBlockSchema,        styles: [ColorStylesSchema, SpacingStylesSchema] },
  Divider:          { content: DividerSchema,          styles: [ColorStylesSchema, SpacingStylesSchema] },
  Spacer:           { content: SpacerSchema,           styles: [SpacingStylesSchema] },
  Alert:            { content: AlertSchema,            styles: [ColorStylesSchema, TypographyStylesSchema] },
  ProgressBar:      { content: ProgressBarSchema,      styles: [ColorStylesSchema] },

  // ── Composite (special-cased in renderer, no "Add block" button) ──────────
  Composite: { content: CompositeSchema, styles: [] },
}

/**
 * LayoutSchemas — keyed by layout slot type.
 * Same shape as BlockSchemas so BlockEditorPanel can consume both.
 */
export const LayoutSchemas: Record<string, any> = {
  LayoutHeader: { content: HeaderSchema, styles: [ColorStylesSchema] },
  LayoutFooter: { content: FooterSchema, styles: [ColorStylesSchema] },
}

export { HeaderSchema, FooterSchema }
export { ColorStylesSchema, TypographyStylesSchema, SpacingStylesSchema, GridStylesSchema }
