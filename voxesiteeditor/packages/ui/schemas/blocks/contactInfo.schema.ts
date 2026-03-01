export const ContactInfoSchema = {
  type: 'ContactInfo',
  label: 'Información de contacto',
  defaultProps: {
    heading: 'Contáctanos',
    email: 'contacto@ejemplo.com',
    phone: '+57 300 000 0000',
    address: 'Bogotá, Colombia',
    mapUrl: ''
  },
  fields: [
    { key: 'heading', label: 'Título',     type: 'string' },
    { key: 'email',   label: 'Email',      type: 'string' },
    { key: 'phone',   label: 'Teléfono',   type: 'string' },
    { key: 'address', label: 'Dirección',  type: 'string' },
    { key: 'mapUrl',  label: 'URL del mapa (embed)', type: 'string' }
  ]
}
