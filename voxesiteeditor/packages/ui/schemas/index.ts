import { BlockManifest } from '../blocks/manifest'
import { CompositeSchema } from './blocks/composite.schema'
import { HeaderSchema } from './layout/header.schema'
import { FooterSchema } from './layout/footer.schema'
import { ColorStylesSchema } from './styles/colors.schema'

/**
 * BlockSchemas — auto-derived from BlockManifest.
 * Adding an entry to manifest.ts automatically registers it here.
 *
 * The Composite type is special-cased: it is resolved inline in renderBlock()
 * and does not appear in the "Add block" menu, but still needs an editor schema
 * so BlockEditorPanel can display its inspector.
 */
export const BlockSchemas: Record<string, any> = {
  ...Object.fromEntries(
    BlockManifest.map(entry => [
      entry.type,
      {
        content: entry.schema,
        styles: entry.styleSchemas ?? []
      }
    ])
  ),
  Composite: {
    content: CompositeSchema,
    styles: []
  }
}

/**
 * Schema registry for layout blocks (header, footer).
 * Same shape as BlockSchemas so BlockEditorPanel can consume both interchangeably.
 */
export const LayoutSchemas: Record<string, any> = {
  LayoutHeader: {
    content: HeaderSchema,
    styles: [ColorStylesSchema]
  },

  LayoutFooter: {
    content: FooterSchema,
    styles: [ColorStylesSchema]
  }
}

export { HeaderSchema, FooterSchema }
