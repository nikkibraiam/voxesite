import { readFile } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const slug = event.context.params!.slug
  const filePath = join(process.cwd(), '../../data/pages', `${slug}.css`)

  setHeader(event, 'Content-Type', 'text/css')

  try {
    return await readFile(filePath, 'utf-8')
  } catch {
    // CSS vacío, pero request exitoso
    return ''
  }
})
