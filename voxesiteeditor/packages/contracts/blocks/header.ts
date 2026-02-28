import type { BaseBlock } from '../page'

export interface HeaderNavLink {
  label: string
  href: string
}

export interface HeaderProps {
  /** Plain-text logo label shown when no image is set */
  logoText?: string
  /** URL of the logo image (overrides logoText when set) */
  logoImageUrl?: string
  /** Alt text for the logo image */
  logoAlt?: string
  /** Navigation links — serialized as JSON in the editor form */
  navLinks?: HeaderNavLink[]
  backgroundColor?: string
  sticky?: boolean
  class?: string | string[]
}

export type HeaderBlock = BaseBlock<'LayoutHeader', HeaderProps>
