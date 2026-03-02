export const ProductDetailSchema = {
  type: 'ProductDetail',
  label: 'Detalle de producto',
  defaultProps: {
    name: 'Nombre del producto',
    price: 99.99,
    originalPrice: 149.99,
    currency: '$',
    description: 'Descripción detallada del producto.',
    ctaLabel: 'Comprar ahora',
    ctaUrl: '#',
    images: JSON.stringify([
      { url: 'https://picsum.photos/seed/pd1/600/400', alt: 'Vista 1' }
    ]),
    specs: JSON.stringify([
      { label: 'Material', value: 'Algodón 100%' },
      { label: 'Peso', value: '250g' }
    ])
  },
  fields: [
    { key: 'name',          label: 'Nombre',           type: 'string' },
    { key: 'price',         label: 'Precio',           type: 'string' },
    { key: 'originalPrice', label: 'Precio original',  type: 'string' },
    { key: 'currency',      label: 'Moneda',           type: 'string' },
    { key: 'description',   label: 'Descripción',      type: 'string' },
    { key: 'ctaLabel',      label: 'Texto del botón',  type: 'string' },
    { key: 'ctaUrl',        label: 'URL del botón',    type: 'string' },
    { key: 'images',        label: 'Imágenes (JSON)',  type: 'json' },
    { key: 'specs',         label: 'Especificaciones (JSON)', type: 'json' }
  ]
}
