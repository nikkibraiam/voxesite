import type { BaseBlock } from '../page'

export interface SocialLink {
  platform: string
  url: string
}

export interface TeamMember {
  name: string
  role?: string
  bio?: string
  avatarUrl?: string
  socialLinks?: SocialLink[]
}

export interface TeamSectionProps {
  heading?: string
  members?: TeamMember[] | string
  columns?: number
  nonce?: string
}

export type TeamSectionBlock = BaseBlock<'TeamSection', TeamSectionProps>
