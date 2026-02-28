import type { HeroBlock } from './blocks/hero'
import type { TextBlock } from './blocks/text'

export type BlockStyles = {
  [selector: string]: {
    [cssProperty: string]: string
  }
}

export interface IBlockBase {
  customCss?: string
}

export type BaseBlock<TType extends string, TProps> = IBlockBase & {
  id: string
  type: TType
  props: TProps
  styles?: BlockStyles
}

export type Page = {
  id: string
  slug: string
  /** Short human label shown in editor page tabs. Distinct from seo.title. */
  title?: string
  seo?: {
    title: string
    description?: string
  }
  blocks: BaseBlock<string, any>[]
  cssFile?: string
}

// ─── Site model ──────────────────────────────────────────────────────────────

/**
 * A block used in a shared layout slot (header, footer).
 * Structurally identical to BaseBlock — tagged separately for clarity.
 */
export type LayoutBlock = BaseBlock<string, any>

/**
 * A named responsive grid configuration available to pages.
 * Placeholder — fully extended in the roadmap grid feature.
 */
export interface GridDefinition {
  id: string
  name: string
  columns: number
  gap?: string
}

/** Shared layout rendered around every page (header, footer, grid definitions). */
export interface SiteLayout {
  header?: LayoutBlock
  footer?: LayoutBlock
  grids?: GridDefinition[]
}

/** Lightweight record of one published snapshot, returned by GET /versions. */
export interface SiteVersion {
  version: string       // semver e.g. "1.2.0"
  publishedAt: string   // ISO 8601 string
}

/**
 * Root data model. Replaces the single-Page model as the persistence unit.
 * Contains every page of the site plus the shared layout.
 */
export interface Site {
  id: string
  version: string       // semver e.g. "1.0.0"
  pages: Page[]
  layout: SiteLayout
  publishedAt?: string  // ISO 8601 — set on each publish
}
