export const TableSchema = {
  type: 'Table',
  label: 'Tabla de datos',
  defaultProps: {
    striped: true,
    bordered: false,
    caption: '',
    headers: JSON.stringify(['Columna 1', 'Columna 2', 'Columna 3']),
    rows: JSON.stringify([
      ['Celda 1.1', 'Celda 1.2', 'Celda 1.3'],
      ['Celda 2.1', 'Celda 2.2', 'Celda 2.3']
    ])
  },
  fields: [
    { key: 'headers',  label: 'Encabezados (JSON)', type: 'json' },
    { key: 'rows',     label: 'Filas (JSON 2D)',    type: 'json' },
    { key: 'caption',  label: 'Leyenda',            type: 'string' },
    { key: 'striped',  label: 'Filas alternas',     type: 'boolean' },
    { key: 'bordered', label: 'Con bordes',         type: 'boolean' }
  ]
}
