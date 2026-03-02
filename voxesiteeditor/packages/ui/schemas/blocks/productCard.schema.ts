export const ProductCardSchema = {
  type: 'ProductCard',
  label: 'Tarjeta de producto',
  defaultProps: {
    imageUrl: 'https://picsum.photos/seed/product/400/300',
    name: 'Nombre del producto',
    price: 99.99,
    originalPrice: 149.99,
    badge: 'Nuevo',
    ctaLabel: 'Ver producto',
    ctaUrl: '#',
    currency: '$'
  },
  fields: [
    { key: 'imageUrl',      label: 'URL de imagen',    type: 'string' },
    { key: 'name',          label: 'Nombre',           type: 'string' },
    { key: 'price',         label: 'Precio',           type: 'string' },
    { key: 'originalPrice', label: 'Precio original',  type: 'string' },
    { key: 'badge',         label: 'Etiqueta/badge',   type: 'string' },
    { key: 'ctaLabel',      label: 'Texto del botón',  type: 'string' },
    { key: 'ctaUrl',        label: 'URL del botón',    type: 'string' },
    { key: 'currency',      label: 'Moneda',           type: 'string' }
  ]
}
