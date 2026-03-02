export const DividerSchema = {
  type: 'Divider',
  label: 'Divisor',
  defaultProps: {
    style: 'line',
    margin: 'md'
  },
  fields: [
    { key: 'style',  label: 'Estilo (line/dots/wave/fade)', type: 'string' },
    { key: 'margin', label: 'Margen (sm/md/lg)',            type: 'string' }
  ]
}
