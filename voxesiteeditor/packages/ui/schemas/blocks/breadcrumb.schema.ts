export const BreadcrumbSchema = {
  type: 'Breadcrumb',
  label: 'Migas de pan',
  defaultProps: {
    separator: '/',
    items: JSON.stringify([
      { label: 'Inicio', href: '/' },
      { label: 'Categoría', href: '/categoria' },
      { label: 'Página actual' }
    ])
  },
  fields: [
    { key: 'items',     label: 'Elementos (JSON)', type: 'json' },
    { key: 'separator', label: 'Separador',        type: 'string' }
  ]
}
