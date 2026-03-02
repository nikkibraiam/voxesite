export interface Product {
  id: string
  slug: string
  name: string
  description: string
  price: number
  originalPrice?: number
  currency: 'COP' | 'USD' | string
  images: string[]          // absolute URLs
  category: string
  tags: string[]
  stock?: number
  sku?: string
  seo?: {
    title: string
    description: string
    ogImage?: string
  }
  attributes?: Record<string, string>   // color, size, material, etc.
  relatedProductIds?: string[]
}
