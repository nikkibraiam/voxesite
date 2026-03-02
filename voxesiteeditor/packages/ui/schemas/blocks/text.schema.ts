export const TextBlockSchema = {
  type: 'TextBlock',
  label: 'Texto',
  defaultProps: { text: 'Texto desde editor' },
  fields: [
    {
      key: 'text',
      label: 'Texto',
      type: 'string'
    },
    {
      key: 'customCss',
      label: 'CSS Custom',
      type: 'css'
    }
  ]
}
