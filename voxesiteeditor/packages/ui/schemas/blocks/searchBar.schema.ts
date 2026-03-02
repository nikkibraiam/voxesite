export const SearchBarSchema = {
  type: 'SearchBar',
  label: 'Barra de búsqueda',
  defaultProps: {
    placeholder: 'Buscar...',
    searchUrl: '/search?q={query}',
    buttonLabel: 'Buscar'
  },
  fields: [
    { key: 'placeholder', label: 'Placeholder',           type: 'string' },
    { key: 'searchUrl',   label: 'URL de búsqueda',       type: 'string' },
    { key: 'buttonLabel', label: 'Texto del botón',       type: 'string' }
  ]
}
