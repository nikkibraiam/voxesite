export const TypographyStylesSchema = {
  group: 'Typography',
  fields: [
    {
      label: 'Tamaño de fuente',
      type: 'string',
      selector: '.text, .hero__title, .hero__subtitle, .text-block',
      cssProperty: 'font-size'
    },
    {
      label: 'Peso',
      type: 'string',
      selector: '.text, .hero__title, .hero__subtitle, .text-block',
      cssProperty: 'font-weight'
    },
    {
      label: 'Altura de línea',
      type: 'string',
      selector: '.text, .hero__title, .hero__subtitle, .text-block',
      cssProperty: 'line-height'
    },
    {
      label: 'Espaciado de letras',
      type: 'string',
      selector: '.text, .hero__title, .hero__subtitle, .text-block',
      cssProperty: 'letter-spacing'
    }
  ]
}
