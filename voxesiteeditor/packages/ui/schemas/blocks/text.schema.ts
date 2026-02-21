export const TextBlockSchema = {
  type: 'TextBlock',
  label: 'Texto',
  defaultProps: { text: 'Texto desde editor' },
  content: [
    {
      key: 'text',
      label: 'Texto',
      type: 'string'
    }
  ]
}
