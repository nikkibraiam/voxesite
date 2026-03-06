export const CardGridSchema = {
  type: 'CardGrid',
  label: 'Tarjetas',
  defaultProps: {
    heading: 'Nuestros servicios',
    columns: 3,
    cards: [
      { title: 'Tarjeta 1', text: 'Descripción de la tarjeta.', ctaLabel: 'Ver más', ctaUrl: '#' }
    ],
    bgColor: '',
    cardBgColor: ''
  },
  fields: [
    { key: 'heading',     label: 'Título de sección', type: 'string' },
    { key: 'columns',     label: 'Columnas',           type: 'string' },
    {
      key: 'cards',
      label: 'Tarjetas',
      type: 'array',
      subfields: [
        { key: 'title',    label: 'Título',      type: 'string' },
        { key: 'text',     label: 'Descripción', type: 'string' },
        { key: 'imageUrl', label: 'URL imagen',  type: 'string' },
        { key: 'ctaLabel', label: 'Texto CTA',   type: 'string' },
        { key: 'ctaUrl',   label: 'URL CTA',     type: 'string' }
      ]
    },
    { key: 'bgColor',     label: 'Fondo de sección',  type: 'color' },
    { key: 'cardBgColor', label: 'Fondo de tarjeta',  type: 'color' }
  ]
}
