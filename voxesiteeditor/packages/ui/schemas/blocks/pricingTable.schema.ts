export const PricingTableSchema = {
  type: 'PricingTable',
  label: 'Tabla de precios',
  defaultProps: {
    heading: 'Nuestros planes',
    subheading: 'Elige el plan que mejor se adapte a tus necesidades.',
    plans: JSON.stringify([
      {
        name: 'Básico',
        price: '$9',
        period: '/mes',
        features: ['5 proyectos', '10 GB almacenamiento', 'Soporte por email'],
        highlighted: false,
        ctaLabel: 'Empezar',
        ctaUrl: '#'
      },
      {
        name: 'Pro',
        price: '$29',
        period: '/mes',
        features: ['Proyectos ilimitados', '100 GB almacenamiento', 'Soporte prioritario'],
        highlighted: true,
        ctaLabel: 'Empezar',
        ctaUrl: '#'
      }
    ])
  },
  fields: [
    { key: 'heading',    label: 'Título',        type: 'string' },
    { key: 'subheading', label: 'Subtítulo',      type: 'string' },
    { key: 'plans',      label: 'Planes (JSON)', type: 'json' }
  ]
}
