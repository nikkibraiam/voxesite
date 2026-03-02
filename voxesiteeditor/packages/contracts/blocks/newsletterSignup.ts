import type { BaseBlock } from '../page'

export interface NewsletterSignupProps {
  title?: string
  description?: string
  placeholder?: string
  buttonLabel?: string
  endpointKey?: string
  successMessage?: string
  nonce?: string
}

export type NewsletterSignupBlock = BaseBlock<'NewsletterSignup', NewsletterSignupProps>
