export const LogoCloudSchema = {
  type: 'LogoCloud',
  label: 'Nube de logos',
  defaultProps: {
    title: 'Empresas que confían en nosotros',
    grayscale: true,
    logos: JSON.stringify([
      { imageUrl: 'https://picsum.photos/seed/logo1/120/40', alt: 'Empresa 1', url: '#' },
      { imageUrl: 'https://picsum.photos/seed/logo2/120/40', alt: 'Empresa 2', url: '#' },
      { imageUrl: 'https://picsum.photos/seed/logo3/120/40', alt: 'Empresa 3', url: '#' }
    ])
  },
  fields: [
    { key: 'title',     label: 'Título',          type: 'string' },
    { key: 'grayscale', label: 'Escala de grises', type: 'boolean' },
    { key: 'logos',     label: 'Logos (JSON)',     type: 'json' }
  ]
}
