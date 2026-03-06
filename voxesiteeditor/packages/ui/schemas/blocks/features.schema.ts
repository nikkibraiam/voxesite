export const FeaturesSchema = {
  type: 'Features',
  label: 'Características',
  defaultProps: {
    heading: 'Nuestras características',
    subheading: '',
    columns: 3,
    features: [
      { icon: '⚡', title: 'Rápido', description: 'Rendimiento optimizado.' },
      { icon: '🔒', title: 'Seguro', description: 'Tu información protegida.' },
      { icon: '📱', title: 'Adaptable', description: 'Funciona en todos los dispositivos.' }
    ]
  },
  fields: [
    { key: 'heading',    label: 'Título',               type: 'string' },
    { key: 'subheading', label: 'Subtítulo',             type: 'string' },
    { key: 'columns',    label: 'Columnas',              type: 'string' },
    {
      key: 'features',
      label: 'Características',
      type: 'array',
      subfields: [
        { key: 'icon',        label: 'Icono (emoji)',  type: 'string' },
        { key: 'title',       label: 'Título',         type: 'string' },
        { key: 'description', label: 'Descripción',    type: 'string' }
      ]
    }
  ]
}
