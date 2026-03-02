export const AlertSchema = {
  type: 'Alert',
  label: 'Alerta',
  defaultProps: {
    type: 'info',
    title: '',
    message: 'Este es un mensaje de información importante.',
    dismissible: false
  },
  fields: [
    { key: 'type',        label: 'Tipo (info/success/warning/error)', type: 'string' },
    { key: 'title',       label: 'Título (opcional)',                 type: 'string' },
    { key: 'message',     label: 'Mensaje',                          type: 'string' },
    { key: 'dismissible', label: 'Se puede cerrar',                  type: 'boolean' }
  ]
}
