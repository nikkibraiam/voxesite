export const ImageGallerySchema = {
  type: 'ImageGallery',
  label: 'Galería de imágenes',
  defaultProps: {
    heading: '',
    images: JSON.stringify([
      { url: 'https://picsum.photos/seed/1/600/400', alt: 'Imagen 1' },
      { url: 'https://picsum.photos/seed/2/600/400', alt: 'Imagen 2' },
      { url: 'https://picsum.photos/seed/3/600/400', alt: 'Imagen 3' }
    ]),
    layout: 'grid',
    columns: 3
  },
  fields: [
    { key: 'heading', label: 'Título',       type: 'string' },
    { key: 'images',  label: 'Imágenes (JSON)', type: 'json' },
    { key: 'layout',  label: 'Diseño (grid/masonry)', type: 'string' },
    { key: 'columns', label: 'Columnas',     type: 'string' }
  ]
}
