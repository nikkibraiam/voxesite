export const NewsletterSignupSchema = {
  type: 'NewsletterSignup',
  label: 'Suscripción newsletter',
  defaultProps: {
    title: 'Suscríbete a nuestro boletín',
    description: 'Recibe las últimas noticias y ofertas directamente en tu correo.',
    placeholder: 'tu@correo.com',
    buttonLabel: 'Suscribirse',
    endpointKey: '',
    successMessage: '¡Gracias por suscribirte!'
  },
  fields: [
    { key: 'title',          label: 'Título',           type: 'string' },
    { key: 'description',    label: 'Descripción',      type: 'string' },
    { key: 'placeholder',    label: 'Placeholder',      type: 'string' },
    { key: 'buttonLabel',    label: 'Texto del botón',  type: 'string' },
    { key: 'endpointKey',    label: 'Endpoint Key',     type: 'string' },
    { key: 'successMessage', label: 'Mensaje de éxito', type: 'string' }
  ]
}
