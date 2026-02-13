import { writeFile, mkdir } from 'fs/promises'
import { resolve, join } from 'path'
import type { Page } from '@cms/contracts'
import { generateBlockCss } from '@cms/utils'

export default defineEventHandler(async (event) => {
  const page = await readBody<Page>(event)

  // Carpeta de JSON
  const jsonDir = resolve(process.cwd(), '../runtime/public/data/pages')
  await mkdir(jsonDir, { recursive: true })
  await writeFile(join(jsonDir, `${page.slug}.json`), JSON.stringify(page, null, 2), 'utf-8')

  // Carpeta de CSS generado
  const cssDir = resolve(process.cwd(), '../runtime/public/generated-css')
  await mkdir(cssDir, { recursive: true })

  // Generamos CSS usando tu util
  let cssContent = ''
  for (const block of page.blocks) {
    cssContent += generateBlockCss(block)
  }

  const cssFileName = `${page.slug}.css`
  await writeFile(join(cssDir, cssFileName), cssContent, 'utf-8')

  // Guardamos la ruta del CSS en el JSON
  page.cssFile = `/generated-css/${cssFileName}`
  await writeFile(join(jsonDir, `${page.slug}.json`), JSON.stringify(page, null, 2), 'utf-8')

  return { ok: true, cssFile: page.cssFile }
})
