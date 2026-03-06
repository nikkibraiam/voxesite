export const BreadcrumbSchema = {
  type: 'Breadcrumb',
  label: 'Migas de pan',
  defaultProps: {
    separator: '/',
    items: [
      { label: 'Inicio', href: '/' },
      { label: 'Categoría', href: '/categoria' },
      { label: 'Página actual', href: '' }
    ]
  },
  fields: [
    {
      key: 'items',
      label: 'Elementos',
      type: 'array',
      subfields: [
        { key: 'label', label: 'Etiqueta', type: 'string' },
        { key: 'href',  label: 'URL',      type: 'string' }
      ]
    },
    { key: 'separator', label: 'Separador',        type: 'string' }
  ]
}
