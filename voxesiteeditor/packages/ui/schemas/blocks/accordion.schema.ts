export const AccordionSchema = {
  type: 'Accordion',
  label: 'Acordeón',
  defaultProps: {
    openFirst: true,
    openMultiple: false,
    items: JSON.stringify([
      { title: 'Sección 1', content: 'Contenido de la primera sección.' },
      { title: 'Sección 2', content: 'Contenido de la segunda sección.' }
    ])
  },
  fields: [
    { key: 'openFirst',    label: 'Abrir primera por defecto', type: 'boolean' },
    { key: 'openMultiple', label: 'Abrir múltiples',           type: 'boolean' },
    { key: 'items',        label: 'Secciones (JSON)',          type: 'json' }
  ]
}
