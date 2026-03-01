export const FAQSchema = {
  type: 'FAQ',
  label: 'Preguntas frecuentes',
  defaultProps: {
    heading: 'Preguntas frecuentes',
    openMultiple: false,
    items: JSON.stringify([
      { question: '¿Cómo puedo empezar?', answer: 'Regístrate y empieza de forma gratuita.' },
      { question: '¿Ofrecen soporte?', answer: 'Sí, ofrecemos soporte por email y chat.' }
    ])
  },
  fields: [
    { key: 'heading',      label: 'Título',                   type: 'string' },
    { key: 'openMultiple', label: 'Abrir múltiples respuestas', type: 'boolean' },
    { key: 'items',        label: 'Preguntas (JSON)',          type: 'json' }
  ]
}
