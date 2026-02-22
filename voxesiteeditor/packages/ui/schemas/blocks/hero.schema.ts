export const HeroSchema = {
  type: 'Hero',
  label: 'Hero',
  defaultProps: { title: 'Hero desde editor' },
  fields: [
    { key: 'title', label: 'Título', type: 'string' },
    { key: 'subtitle', label: 'Subtítulo', type: 'string' },
    { key: 'class', label: 'Clases', type: 'string' },
    { key: 'customCss', label: 'CSS Custom', type: 'css' }
  ]
}
