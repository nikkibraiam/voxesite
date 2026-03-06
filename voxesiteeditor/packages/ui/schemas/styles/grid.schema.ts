export const GridStylesSchema = {
  group: 'Posición en Grilla',
  fields: [
    {
      label: 'Columna (grid-column)',
      type: 'string',
      selector: '',
      cssProperty: 'grid-column'
    },
    {
      label: 'Fila (grid-row)',
      type: 'string',
      selector: '',
      cssProperty: 'grid-row'
    },
    {
      label: 'Columnas internas',
      type: 'string',
      selector: '',
      cssProperty: 'grid-template-columns'
    },
    {
      label: 'Espaciado de grilla',
      type: 'string',
      selector: '',
      cssProperty: 'gap'
    }
  ]
}
