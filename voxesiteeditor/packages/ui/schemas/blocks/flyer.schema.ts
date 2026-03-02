export const FlyerSchema = {
  type: 'Flyer',
  label: 'Flyer / Póster',
  defaultProps: {
    bgImageUrl: 'https://picsum.photos/seed/flyer/1200/600',
    title: 'Título del Flyer',
    subtitle: 'Subtítulo o mensaje principal',
    overlay: true,
    overlayOpacity: 0.5,
    textColor: '#ffffff'
  },
  fields: [
    { key: 'bgImageUrl',      label: 'URL de imagen de fondo', type: 'string' },
    { key: 'title',           label: 'Título',                 type: 'string' },
    { key: 'subtitle',        label: 'Subtítulo',              type: 'string' },
    { key: 'overlay',         label: 'Overlay oscuro',         type: 'boolean' },
    { key: 'overlayOpacity',  label: 'Opacidad del overlay',   type: 'string' },
    { key: 'textColor',       label: 'Color de texto',         type: 'color' }
  ]
}
