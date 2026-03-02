export const ProductGridSchema = {
  type: 'ProductGrid',
  label: 'Catálogo de productos',
  defaultProps: {
    heading: 'Nuestros productos',
    columns: 3,
    showFilter: false,
    filterKey: 'badge',
    products: JSON.stringify([
      { imageUrl: 'https://picsum.photos/seed/p1/400/300', name: 'Producto 1', price: 49.99, currency: '$', ctaLabel: 'Ver', ctaUrl: '#' },
      { imageUrl: 'https://picsum.photos/seed/p2/400/300', name: 'Producto 2', price: 79.99, currency: '$', ctaLabel: 'Ver', ctaUrl: '#' }
    ])
  },
  fields: [
    { key: 'heading',    label: 'Título',             type: 'string' },
    { key: 'columns',    label: 'Columnas',           type: 'string' },
    { key: 'showFilter', label: 'Mostrar filtro',     type: 'boolean' },
    { key: 'filterKey',  label: 'Campo de filtro',    type: 'string' },
    { key: 'products',   label: 'Productos (JSON)',   type: 'json' }
  ]
}
