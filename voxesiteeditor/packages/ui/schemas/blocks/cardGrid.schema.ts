export const CardGridSchema = {
  type: 'CardGrid',
  label: 'Tarjetas',
  defaultProps: {
    heading: 'Nuestros servicios',
    columns: 3,
    cards: JSON.stringify([
      { title: 'Tarjeta 1', text: 'Descripción de la tarjeta.', ctaLabel: 'Ver más', ctaUrl: '#' }
    ]),
    bgColor: '',
    cardBgColor: ''
  },
  fields: [
    { key: 'heading',     label: 'Título de sección',  type: 'string' },
    { key: 'columns',     label: 'Columnas',            type: 'string' },
    { key: 'cards',       label: 'Tarjetas (JSON)',     type: 'json' },
    { key: 'bgColor',     label: 'Fondo de sección',    type: 'color' },
    { key: 'cardBgColor', label: 'Fondo de tarjeta',    type: 'color' }
  ]
}
