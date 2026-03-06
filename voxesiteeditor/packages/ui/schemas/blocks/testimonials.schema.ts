export const TestimonialsSchema = {
  type: 'Testimonials',
  label: 'Testimonios',
  defaultProps: {
    heading: 'Lo que dicen nuestros clientes',
    layout: 'grid',
    testimonials: [
      {
        text: 'Excelente servicio, totalmente recomendado.',
        author: 'María García',
        avatarUrl: '',
        rating: 5
      }
    ]
  },
  fields: [
    { key: 'heading', label: 'Título',               type: 'string' },
    { key: 'layout',  label: 'Diseño (grid/carousel)', type: 'string' },
    {
      key: 'testimonials',
      label: 'Testimonios',
      type: 'array',
      subfields: [
        { key: 'text',      label: 'Texto',          type: 'string' },
        { key: 'author',    label: 'Autor',          type: 'string' },
        { key: 'role',      label: 'Cargo / Empresa', type: 'string' },
        { key: 'avatarUrl', label: 'URL avatar',     type: 'string' },
        { key: 'rating',    label: 'Estrellas (1-5)', type: 'number' }
      ]
    }
  ]
}
