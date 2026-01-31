export type HeroBlock = {
  id: string
  type: 'Hero'
  props: {
    title: string
    subtitle?: string
    ctaText?: string
    ctaUrl?: string
  }
}
