export const TeamSectionSchema = {
  type: 'TeamSection',
  label: 'Equipo',
  defaultProps: {
    heading: 'Nuestro equipo',
    columns: 3,
    members: [
      {
        name: 'Ana García',
        role: 'CEO',
        bio: 'Apasionada por la innovación y el liderazgo.',
        avatarUrl: 'https://i.pravatar.cc/150?img=1'
      }
    ]
  },
  fields: [
    { key: 'heading', label: 'Título',          type: 'string' },
    { key: 'columns', label: 'Columnas',        type: 'string' },
    {
      key: 'members',
      label: 'Miembros',
      type: 'array',
      subfields: [
        { key: 'name',      label: 'Nombre',       type: 'string' },
        { key: 'role',      label: 'Cargo',        type: 'string' },
        { key: 'bio',       label: 'Biografía',    type: 'string' },
        { key: 'avatarUrl', label: 'URL avatar',   type: 'string' }
      ]
    }
  ]
}
