export const TabsSchema = {
  type: 'Tabs',
  label: 'Pestañas',
  defaultProps: {
    defaultTab: 0,
    tabs: JSON.stringify([
      { label: 'Pestaña 1', content: 'Contenido de la primera pestaña.' },
      { label: 'Pestaña 2', content: 'Contenido de la segunda pestaña.' }
    ])
  },
  fields: [
    { key: 'defaultTab', label: 'Pestaña inicial (índice)', type: 'string' },
    { key: 'tabs',       label: 'Pestañas (JSON)',          type: 'json' }
  ]
}
