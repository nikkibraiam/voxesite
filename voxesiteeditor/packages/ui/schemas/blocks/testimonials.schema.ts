export const TestimonialsSchema = {
  type: 'Testimonials',
  label: 'Testimonios',
  defaultProps: {
    heading: 'Lo que dicen nuestros clientes',
    layout: 'grid',
    testimonials: JSON.stringify([
      {
        text: 'Excelente servicio, totalmente recomendado.',
        author: 'María García',
        avatarUrl: '',
        rating: 5
      }
    ])
  },
  fields: [
    { key: 'heading',      label: 'Título',             type: 'string' },
    { key: 'layout',       label: 'Diseño (grid/carousel)', type: 'string' },
    { key: 'testimonials', label: 'Testimonios (JSON)', type: 'json' }
  ]
}
