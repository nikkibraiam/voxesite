export const MapEmbedSchema = {
  type: 'MapEmbed',
  label: 'Mapa',
  defaultProps: {
    address: 'Bogotá, Colombia',
    zoom: 14,
    height: '400px',
    title: 'Nuestra ubicación'
  },
  fields: [
    { key: 'address', label: 'Dirección',  type: 'string' },
    { key: 'zoom',    label: 'Zoom (1–20)', type: 'string' },
    { key: 'height',  label: 'Altura',     type: 'string' },
    { key: 'title',   label: 'Título',     type: 'string' }
  ]
}
