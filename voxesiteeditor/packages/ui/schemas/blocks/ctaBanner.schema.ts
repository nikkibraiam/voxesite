export const CTABannerSchema = {
  type: 'CTABanner',
  label: 'Banner CTA',
  defaultProps: {
    heading: '¿Listo para empezar?',
    subtext: 'Únete a miles de usuarios que ya confían en nosotros.',
    buttonLabel: 'Comenzar ahora',
    buttonUrl: '#',
    bgColor: '#1a1a2e',
    textColor: '#ffffff'
  },
  fields: [
    { key: 'heading',     label: 'Título principal', type: 'string' },
    { key: 'subtext',     label: 'Subtexto',         type: 'string' },
    { key: 'buttonLabel', label: 'Texto del botón',  type: 'string' },
    { key: 'buttonUrl',   label: 'URL del botón',    type: 'string' },
    { key: 'bgColor',     label: 'Color de fondo',   type: 'color' },
    { key: 'textColor',   label: 'Color de texto',   type: 'color' }
  ]
}
