export const ProductGridSchema = {
  type: 'ProductGrid',
  label: 'Catálogo de productos',
  defaultProps: {
    heading: 'Nuestros productos',
    columns: 3,
    showFilter: false,
    filterKey: 'badge',
    products: [
      { imageUrl: 'https://picsum.photos/seed/p1/400/300', name: 'Producto 1', price: 49.99, currency: '$', ctaLabel: 'Ver', ctaUrl: '#' },
      { imageUrl: 'https://picsum.photos/seed/p2/400/300', name: 'Producto 2', price: 79.99, currency: '$', ctaLabel: 'Ver', ctaUrl: '#' }
    ]
  },
  fields: [
    { key: 'heading',    label: 'Título',             type: 'string' },
    { key: 'columns',    label: 'Columnas',           type: 'string' },
    { key: 'showFilter', label: 'Mostrar filtro',     type: 'boolean' },
    { key: 'filterKey',  label: 'Campo de filtro',    type: 'string' },
    {
      key: 'products',
      label: 'Productos',
      type: 'array',
      subfields: [
        { key: 'imageUrl',  label: 'URL imagen',  type: 'string' },
        { key: 'name',      label: 'Nombre',      type: 'string' },
        { key: 'price',     label: 'Precio',      type: 'number' },
        { key: 'currency',  label: 'Moneda',      type: 'string' },
        { key: 'badge',     label: 'Badge',       type: 'string' },
        { key: 'ctaLabel',  label: 'Texto CTA',   type: 'string' },
        { key: 'ctaUrl',    label: 'URL CTA',     type: 'string' }
      ]
    }
  ]
}
