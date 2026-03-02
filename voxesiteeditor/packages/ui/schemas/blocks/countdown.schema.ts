export const CountdownSchema = {
  type: 'Countdown',
  label: 'Cuenta regresiva',
  defaultProps: {
    targetDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
    labels: JSON.stringify({ days: 'Días', hours: 'Horas', minutes: 'Min', seconds: 'Seg' }),
    style: 'boxes',
    expiredMessage: '¡El evento ha comenzado!'
  },
  fields: [
    { key: 'targetDate',      label: 'Fecha objetivo (ISO)',  type: 'string' },
    { key: 'labels',          label: 'Etiquetas (JSON)',      type: 'json' },
    { key: 'style',           label: 'Estilo (boxes/minimal)', type: 'string' },
    { key: 'expiredMessage',  label: 'Mensaje al vencer',     type: 'string' }
  ]
}
