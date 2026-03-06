export const TimelineSchema = {
  type: 'Timeline',
  label: 'Línea de tiempo',
  defaultProps: {
    heading: 'Nuestra historia',
    direction: 'vertical',
    events: [
      { date: '2020', title: 'Fundación', description: 'Comenzamos con una gran idea.', icon: '🚀' },
      { date: '2022', title: 'Expansión', description: 'Llegamos a nuevos mercados.', icon: '🌎' },
      { date: '2024', title: 'Hoy',       description: 'Seguimos creciendo.', icon: '🏆' }
    ]
  },
  fields: [
    { key: 'heading',   label: 'Título',                          type: 'string' },
    { key: 'direction', label: 'Dirección (vertical/horizontal)', type: 'string' },
    {
      key: 'events',
      label: 'Eventos',
      type: 'array',
      subfields: [
        { key: 'date',        label: 'Fecha',        type: 'string' },
        { key: 'title',       label: 'Título',       type: 'string' },
        { key: 'description', label: 'Descripción',  type: 'string' },
        { key: 'icon',        label: 'Icono (emoji)', type: 'string' }
      ]
    }
  ]
}
