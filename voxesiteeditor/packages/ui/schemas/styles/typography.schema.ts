export const TypographyStylesSchema = {
  group: 'Typography',
  fields: [
    {
      key: 'fontSize',
      label: 'Tamaño de fuente',
      type: 'select',
      options: ['14px', '16px', '20px', '32px'],
      selector: '.text',
      cssProperty: 'font-size'
    },
    {
      key: 'fontWeight',
      label: 'Peso',
      type: 'select',
      options: ['400', '600', '700'],
      selector: '.text',
      cssProperty: 'font-weight'
    }
  ]
}
