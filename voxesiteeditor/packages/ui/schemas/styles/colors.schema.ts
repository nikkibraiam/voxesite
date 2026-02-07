export const ColorStylesSchema = {
  group: 'Colors',
  fields: [
    {
      key: 'textColor',
      label: 'Color de texto',
      type: 'color',
      selector: '.text, .hero__title, .hero__subtitle',
      cssProperty: 'color'
    },
    {
      key: 'backgroundColor',
      label: 'Color de fondo',
      type: 'color',
      selector: '',
      cssProperty: 'background-color'
    }
  ]
}
