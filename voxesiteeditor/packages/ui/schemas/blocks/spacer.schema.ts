export const SpacerSchema = {
  type: 'Spacer',
  label: 'Espacio en blanco',
  defaultProps: {
    height: 'md',
    customHeight: '80px'
  },
  fields: [
    { key: 'height',       label: 'Tamaño (xs/sm/md/lg/xl/custom)', type: 'string' },
    { key: 'customHeight', label: 'Altura personalizada (CSS)',       type: 'string' }
  ]
}
