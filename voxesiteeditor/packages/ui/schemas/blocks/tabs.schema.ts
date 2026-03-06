export const TabsSchema = {
  type: 'Tabs',
  label: 'Pestañas',
  defaultProps: {
    defaultTab: 0,
    tabs: [
      { label: 'Pestaña 1', content: 'Contenido de la primera pestaña.' },
      { label: 'Pestaña 2', content: 'Contenido de la segunda pestaña.' }
    ]
  },
  fields: [
    { key: 'defaultTab', label: 'Pestaña inicial (índice)', type: 'string' },
    {
      key: 'tabs',
      label: 'Pestañas',
      type: 'array',
      subfields: [
        { key: 'label',   label: 'Etiqueta',  type: 'string' },
        { key: 'content', label: 'Contenido', type: 'string' }
      ]
    }
  ]
}
