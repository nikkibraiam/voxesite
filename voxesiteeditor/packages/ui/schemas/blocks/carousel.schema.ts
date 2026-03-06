export const CarouselSchema = {
  type: 'Carousel',
  label: 'Carrusel',
  defaultProps: {
    autoplay: false,
    interval: 4000,
    showArrows: true,
    showDots: true,
    items: [
      { imageUrl: 'https://picsum.photos/seed/c1/900/400', alt: 'Slide 1', caption: 'Primer slide' },
      { imageUrl: 'https://picsum.photos/seed/c2/900/400', alt: 'Slide 2', caption: 'Segundo slide' }
    ]
  },
  fields: [
    {
      key: 'items',
      label: 'Slides',
      type: 'array',
      subfields: [
        { key: 'imageUrl', label: 'URL imagen', type: 'string' },
        { key: 'alt',      label: 'Alt text',   type: 'string' },
        { key: 'caption',  label: 'Leyenda',    type: 'string' }
      ]
    },
    { key: 'autoplay',   label: 'Reproducción automática', type: 'boolean' },
    { key: 'interval',   label: 'Intervalo (ms)',          type: 'string' },
    { key: 'showArrows', label: 'Mostrar flechas',         type: 'boolean' },
    { key: 'showDots',   label: 'Mostrar puntos',          type: 'boolean' }
  ]
}
