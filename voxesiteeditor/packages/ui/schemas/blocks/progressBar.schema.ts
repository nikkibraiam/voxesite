export const ProgressBarSchema = {
  type: 'ProgressBar',
  label: 'Barra de progreso',
  defaultProps: {
    value: 65,
    max: 100,
    label: 'Progreso',
    color: '#5858c8',
    showPercentage: true
  },
  fields: [
    { key: 'value',          label: 'Valor actual', type: 'string' },
    { key: 'max',            label: 'Valor máximo', type: 'string' },
    { key: 'label',          label: 'Etiqueta',     type: 'string' },
    { key: 'color',          label: 'Color',        type: 'color' },
    { key: 'showPercentage', label: 'Mostrar %',    type: 'boolean' }
  ]
}
