export const AccordionSchema = {
  type: 'Accordion',
  label: 'Acordeón',
  defaultProps: {
    openFirst: true,
    openMultiple: false,
    items: [
      { title: 'Sección 1', content: 'Contenido de la primera sección.' },
      { title: 'Sección 2', content: 'Contenido de la segunda sección.' }
    ]
  },
  fields: [
    { key: 'openFirst',    label: 'Abrir primera por defecto', type: 'boolean' },
    { key: 'openMultiple', label: 'Abrir múltiples',           type: 'boolean' },
    {
      key: 'items',
      label: 'Secciones',
      type: 'array',
      subfields: [
        { key: 'title',   label: 'Título',    type: 'string' },
        { key: 'content', label: 'Contenido', type: 'string' }
      ]
    }
  ]
}
