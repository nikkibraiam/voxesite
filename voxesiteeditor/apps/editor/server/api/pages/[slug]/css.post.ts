import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const slug = event.context.params!.slug
  const body = await readBody<{ css: string }>(event)
  
  const dir = join(process.cwd(), '../../data/pages')
  await mkdir(dir, { recursive: true }) // ✅ crea data/pages si no existe

  const filePath = join(dir, `${slug}.css`)
  await writeFile(filePath, body.css, 'utf-8')

  return { ok: true }
})