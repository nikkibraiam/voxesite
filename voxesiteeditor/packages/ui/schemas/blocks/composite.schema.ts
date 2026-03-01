export const CompositeSchema = {
  type: 'Composite',
  label: 'Componente personalizado',
  defaultProps: {
    definitionId: '',
    overrides: {}
  },
  fields: [
    { key: 'definitionId', type: 'string', label: 'ID de definición', readonly: true }
    // overrides are edited inline via the child tree in BlockEditorPanel, not as raw JSON
  ]
}
