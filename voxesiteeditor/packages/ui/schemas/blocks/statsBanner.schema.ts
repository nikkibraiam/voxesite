export const StatsBannerSchema = {
  type: 'StatsBanner',
  label: 'Banner de estadísticas',
  defaultProps: {
    bgColor: '#1a1a2e',
    textColor: '#ffffff',
    columns: 4,
    stats: JSON.stringify([
      { value: '10K+', label: 'Clientes', icon: '👥' },
      { value: '99%',  label: 'Satisfacción', icon: '⭐' },
      { value: '50+',  label: 'Países', icon: '🌎' },
      { value: '24/7', label: 'Soporte', icon: '🛟' }
    ])
  },
  fields: [
    { key: 'stats',     label: 'Estadísticas (JSON)', type: 'json' },
    { key: 'columns',   label: 'Columnas',            type: 'string' },
    { key: 'bgColor',   label: 'Color de fondo',      type: 'color' },
    { key: 'textColor', label: 'Color de texto',      type: 'color' }
  ]
}
