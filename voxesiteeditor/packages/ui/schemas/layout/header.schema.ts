export const HeaderSchema = {
  type: 'LayoutHeader',
  label: 'Header',
  defaultProps: {
    logoText: 'Mi Sitio',
    logoImageUrl: '',
    logoAlt: 'Logo',
    navLinks: [
      { label: 'Inicio', href: '/' },
      { label: 'Nosotros', href: '/about' },
      { label: 'Contacto', href: '/contact' }
    ],
    backgroundColor: '#ffffff',
    sticky: false
  },
  fields: [
    { key: 'logoText',        label: 'Logo (texto)',          type: 'string' },
    { key: 'logoImageUrl',    label: 'Logo (URL imagen)',     type: 'string' },
    { key: 'logoAlt',         label: 'Logo alt',             type: 'string' },
    { key: 'sticky',          label: 'Sticky (fijo al scroll)', type: 'boolean' },
    { key: 'backgroundColor', label: 'Color de fondo',       type: 'color' },
    {
      key: 'navLinks',
      label: 'Vínculos de navegación',
      type: 'array',
      subfields: [
        { key: 'label', label: 'Etiqueta', type: 'string' },
        { key: 'href',  label: 'URL',      type: 'string' }
      ]
    }
  ]
}
