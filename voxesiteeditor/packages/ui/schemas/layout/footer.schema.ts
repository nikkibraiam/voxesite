export const FooterSchema = {
  type: 'LayoutFooter',
  label: 'Footer',
  defaultProps: {
    columns: [
      {
        title: 'Empresa',
        links: [
          { label: 'Inicio', href: '/' },
          { label: 'Nosotros', href: '/about' }
        ]
      },
      {
        title: 'Contacto',
        links: [
          { label: 'Email', href: 'mailto:info@misitio.com' }
        ]
      }
    ],
    copyrightText: '© 2025 Mi Sitio. Todos los derechos reservados.',
    backgroundColor: '#1a1a1a'
  },
  fields: [
    { key: 'copyrightText', label: 'Texto de copyright', type: 'string' },
    { key: 'backgroundColor', label: 'Color de fondo', type: 'color' },
    { key: 'columns', label: 'Columnas (JSON)', type: 'json' }
  ]
}
