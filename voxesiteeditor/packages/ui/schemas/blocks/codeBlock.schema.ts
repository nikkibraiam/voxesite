export const CodeBlockSchema = {
  type: 'CodeBlock',
  label: 'Bloque de código',
  defaultProps: {
    code: 'console.log("Hola mundo")',
    language: 'javascript',
    showCopyButton: true,
    showLineNumbers: true
  },
  fields: [
    { key: 'code',            label: 'Código',                 type: 'css' },
    { key: 'language',        label: 'Lenguaje',               type: 'string' },
    { key: 'showCopyButton',  label: 'Botón copiar',           type: 'boolean' },
    { key: 'showLineNumbers', label: 'Números de línea',       type: 'boolean' }
  ]
}
