export const CarouselSchema = {
  type: 'Carousel',
  label: 'Carrusel',
  defaultProps: {
    autoplay: false,
    interval: 4000,
    showArrows: true,
    showDots: true,
    items: JSON.stringify([
      { imageUrl: 'https://picsum.photos/seed/c1/900/400', alt: 'Slide 1', caption: 'Primer slide' },
      { imageUrl: 'https://picsum.photos/seed/c2/900/400', alt: 'Slide 2', caption: 'Segundo slide' }
    ])
  },
  fields: [
    { key: 'items',      label: 'Slides (JSON)',           type: 'json' },
    { key: 'autoplay',   label: 'Reproducción automática', type: 'boolean' },
    { key: 'interval',   label: 'Intervalo (ms)',          type: 'string' },
    { key: 'showArrows', label: 'Mostrar flechas',         type: 'boolean' },
    { key: 'showDots',   label: 'Mostrar puntos',          type: 'boolean' }
  ]
}
