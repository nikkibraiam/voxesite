import type { BaseBlock } from '../page'

export interface ContactInfoProps {
  heading?: string
  email?: string
  phone?: string
  address?: string
  mapUrl?: string
  nonce?: string
}

export type ContactInfoBlock = BaseBlock<'ContactInfo', ContactInfoProps>
