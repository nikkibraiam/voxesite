export const TextBlockSchema = {
  type: 'TextBlock',
  label: 'Texto',
  fields: [
    {
      key: 'text',
      label: 'Texto',
      type: 'string',
      component: 'input'
    },
    {
      key: 'color',
      label: 'Color',
      type: 'color'
    }
  ]
}
