export const VideoEmbedSchema = {
  type: 'VideoEmbed',
  label: 'Video embebido',
  defaultProps: {
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    autoplay: false,
    muted: false,
    posterUrl: '',
    aspectRatio: '16:9'
  },
  fields: [
    { key: 'videoUrl',    label: 'URL del video (YouTube/Vimeo)', type: 'string' },
    { key: 'autoplay',    label: 'Reproducción automática',       type: 'boolean' },
    { key: 'muted',       label: 'Silenciado',                    type: 'boolean' },
    { key: 'posterUrl',   label: 'URL de la miniatura',           type: 'string' },
    { key: 'aspectRatio', label: 'Relación de aspecto',           type: 'string' }
  ]
}
