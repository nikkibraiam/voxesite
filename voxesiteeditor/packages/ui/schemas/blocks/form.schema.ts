export const FormSchema = {
  type: 'FormBlock',
  label: 'Formulario',
  defaultProps: {
    title: 'Contáctanos',
    description: '',
    fields: [],
    submitLabel: 'Enviar',
    endpointKey: '',
    successMessage: '¡Gracias! Tu mensaje ha sido enviado.',
    errorMessage: 'Ocurrió un error. Por favor intenta de nuevo.',
    redirectUrl: ''
  },
  fields: [
    { key: 'title',          label: 'Título',           type: 'string' },
    { key: 'description',    label: 'Descripción',      type: 'string' },
    { key: 'fields',         label: 'Campos (JSON)',     type: 'json' },
    { key: 'submitLabel',    label: 'Texto del botón',  type: 'string' },
    { key: 'endpointKey',    label: 'Endpoint Key',     type: 'string' },
    { key: 'successMessage', label: 'Mensaje de éxito', type: 'string' },
    { key: 'errorMessage',   label: 'Mensaje de error', type: 'string' },
    { key: 'redirectUrl',    label: 'URL de redirección', type: 'string' }
  ]
}
