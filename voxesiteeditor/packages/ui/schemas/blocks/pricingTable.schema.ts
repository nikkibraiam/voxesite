export const PricingTableSchema = {
  type: 'PricingTable',
  label: 'Tabla de precios',
  defaultProps: {
    heading: 'Nuestros planes',
    subheading: 'Elige el plan que mejor se adapte a tus necesidades.',
    plans: [
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
    ]
  },
  fields: [
    { key: 'heading',    label: 'Título',    type: 'string' },
    { key: 'subheading', label: 'Subtítulo', type: 'string' },
    {
      key: 'plans',
      label: 'Planes',
      type: 'array',
      subfields: [
        { key: 'name',        label: 'Nombre',        type: 'string' },
        { key: 'price',       label: 'Precio',        type: 'string' },
        { key: 'period',      label: 'Período',       type: 'string' },
        { key: 'highlighted', label: 'Destacado',     type: 'boolean' },
        { key: 'ctaLabel',    label: 'Texto del CTA', type: 'string' },
        { key: 'ctaUrl',      label: 'URL del CTA',   type: 'string' }
      ]
    }
  ]
}
