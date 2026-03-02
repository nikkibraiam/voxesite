export const TeamSectionSchema = {
  type: 'TeamSection',
  label: 'Equipo',
  defaultProps: {
    heading: 'Nuestro equipo',
    columns: 3,
    members: JSON.stringify([
      {
        name: 'Ana García',
        role: 'CEO',
        bio: 'Apasionada por la innovación y el liderazgo.',
        avatarUrl: 'https://i.pravatar.cc/150?img=1',
        socialLinks: [{ platform: 'LinkedIn', url: '#' }]
      }
    ])
  },
  fields: [
    { key: 'heading', label: 'Título',          type: 'string' },
    { key: 'columns', label: 'Columnas',        type: 'string' },
    { key: 'members', label: 'Miembros (JSON)', type: 'json' }
  ]
}
