import { readFile } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const slug = event.context.params!.slug
  try {
    const css = await readFile(join(process.cwd(), 'data/pages', `${slug}.css`), 'utf-8')
    event.res.setHeader('Content-Type', 'text/css')
    return css
  } catch {
    event.res.statusCode = 404
    return ''
  }
})