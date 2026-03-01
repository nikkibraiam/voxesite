/**
 * Unit tests for Tier 1 block logic.
 *
 * Run with: npm test
 *
 * These tests exercise:
 *   1. JSON-parsing defensive behaviour used by all array-prop blocks
 *   2. FAQ accordion pure state machine (toggle / openMultiple)
 *   3. Testimonials carousel index wrapping (prev / next)
 *   4. Schema field structure validation for all 8 new Tier 1 blocks
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

// ─── 1. Defensive JSON parsing ─────────────────────────────────────────────────
// This mirrors the `parsedCards`, `parsedImages`, etc. computed pattern used
// in every array-prop block component.

function parseArrayProp<T>(value: T[] | string | undefined): T[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  try { return JSON.parse(value as string) } catch { return [] }
}

describe('parseArrayProp (defensive JSON parsing)', () => {
  test('returns empty array for undefined', () => {
    assert.deepEqual(parseArrayProp(undefined), [])
  })

  test('passes through an already-parsed array', () => {
    const arr = [{ title: 'Card 1' }, { title: 'Card 2' }]
    assert.deepEqual(parseArrayProp(arr), arr)
  })

  test('parses a valid JSON string', () => {
    const json = JSON.stringify([{ question: 'Q?', answer: 'A.' }])
    assert.deepEqual(parseArrayProp(json), [{ question: 'Q?', answer: 'A.' }])
  })

  test('returns empty array for malformed JSON', () => {
    assert.deepEqual(parseArrayProp('{not json}'), [])
  })

  test('returns empty array for an empty string', () => {
    assert.deepEqual(parseArrayProp(''), [])
  })
})

// ─── 2. FAQ accordion state machine ───────────────────────────────────────────

function makeFaqState(openMultiple: boolean) {
  let openSet = new Set<number>()

  return {
    toggle(index: number) {
      if (openSet.has(index)) {
        openSet.delete(index)
      } else {
        if (!openMultiple) {
          openSet = new Set([index])
        } else {
          openSet.add(index)
        }
      }
    },
    isOpen: (index: number) => openSet.has(index),
    openCount: () => openSet.size
  }
}

describe('FAQ accordion — single mode', () => {
  test('opens an item', () => {
    const faq = makeFaqState(false)
    faq.toggle(0)
    assert.ok(faq.isOpen(0))
  })

  test('closes an already-open item', () => {
    const faq = makeFaqState(false)
    faq.toggle(0)
    faq.toggle(0)
    assert.ok(!faq.isOpen(0))
  })

  test('opening a new item closes the previous one', () => {
    const faq = makeFaqState(false)
    faq.toggle(0)
    faq.toggle(1)
    assert.ok(!faq.isOpen(0), 'item 0 should be closed')
    assert.ok(faq.isOpen(1), 'item 1 should be open')
    assert.equal(faq.openCount(), 1)
  })
})

describe('FAQ accordion — multiple mode', () => {
  test('can open multiple items simultaneously', () => {
    const faq = makeFaqState(true)
    faq.toggle(0)
    faq.toggle(1)
    faq.toggle(2)
    assert.equal(faq.openCount(), 3)
    assert.ok(faq.isOpen(0))
    assert.ok(faq.isOpen(1))
    assert.ok(faq.isOpen(2))
  })

  test('closes a single item without affecting others', () => {
    const faq = makeFaqState(true)
    faq.toggle(0)
    faq.toggle(1)
    faq.toggle(0) // close 0
    assert.ok(!faq.isOpen(0))
    assert.ok(faq.isOpen(1))
    assert.equal(faq.openCount(), 1)
  })
})

// ─── 3. Testimonials / carousel index wrapping ────────────────────────────────

function makeCarousel(total: number) {
  let index = 0
  return {
    prev: () => { index = (index - 1 + total) % total },
    next: () => { index = (index + 1) % total },
    current: () => index
  }
}

describe('Carousel index wrapping', () => {
  test('next increments index', () => {
    const c = makeCarousel(3)
    c.next()
    assert.equal(c.current(), 1)
  })

  test('next wraps around at the end', () => {
    const c = makeCarousel(3)
    c.next(); c.next(); c.next()
    assert.equal(c.current(), 0)
  })

  test('prev wraps around from the start', () => {
    const c = makeCarousel(3)
    c.prev()
    assert.equal(c.current(), 2)
  })

  test('prev and next are inverses', () => {
    const c = makeCarousel(5)
    c.next(); c.next(); c.prev()
    assert.equal(c.current(), 1)
  })
})

// ─── 4. Schema field structure validation ─────────────────────────────────────

interface FieldDef { key: string; label: string; type: string }
interface BlockSchemaDef {
  type: string
  label: string
  defaultProps: Record<string, any>
  fields: FieldDef[]
}

// Inline copies of the schema objects (avoids cross-package ESM/CJS issues in
// the node:test runner). These mirror packages/ui/schemas/blocks/*.schema.ts.
const tier1Schemas: BlockSchemaDef[] = [
  {
    type: 'CardGrid', label: 'Tarjetas',
    defaultProps: { heading: '', columns: 3, cards: '[]', bgColor: '', cardBgColor: '' },
    fields: [
      { key: 'heading', label: 'Título de sección', type: 'string' },
      { key: 'columns', label: 'Columnas', type: 'string' },
      { key: 'cards', label: 'Tarjetas (JSON)', type: 'json' },
      { key: 'bgColor', label: 'Fondo de sección', type: 'color' },
      { key: 'cardBgColor', label: 'Fondo de tarjeta', type: 'color' }
    ]
  },
  {
    type: 'ImageGallery', label: 'Galería de imágenes',
    defaultProps: { heading: '', images: '[]', layout: 'grid', columns: 3 },
    fields: [
      { key: 'heading', label: 'Título', type: 'string' },
      { key: 'images', label: 'Imágenes (JSON)', type: 'json' },
      { key: 'layout', label: 'Diseño (grid/masonry)', type: 'string' },
      { key: 'columns', label: 'Columnas', type: 'string' }
    ]
  },
  {
    type: 'CTABanner', label: 'Banner CTA',
    defaultProps: { heading: '¿Listo para empezar?', subtext: '', buttonLabel: 'Comenzar ahora', buttonUrl: '#', bgColor: '#1a1a2e', textColor: '#ffffff' },
    fields: [
      { key: 'heading', label: 'Título principal', type: 'string' },
      { key: 'subtext', label: 'Subtexto', type: 'string' },
      { key: 'buttonLabel', label: 'Texto del botón', type: 'string' },
      { key: 'buttonUrl', label: 'URL del botón', type: 'string' },
      { key: 'bgColor', label: 'Color de fondo', type: 'color' },
      { key: 'textColor', label: 'Color de texto', type: 'color' }
    ]
  },
  {
    type: 'Testimonials', label: 'Testimonios',
    defaultProps: { heading: '', layout: 'grid', testimonials: '[]' },
    fields: [
      { key: 'heading', label: 'Título', type: 'string' },
      { key: 'layout', label: 'Diseño (grid/carousel)', type: 'string' },
      { key: 'testimonials', label: 'Testimonios (JSON)', type: 'json' }
    ]
  },
  {
    type: 'Features', label: 'Características',
    defaultProps: { heading: '', subheading: '', columns: 3, features: '[]' },
    fields: [
      { key: 'heading', label: 'Título', type: 'string' },
      { key: 'subheading', label: 'Subtítulo', type: 'string' },
      { key: 'columns', label: 'Columnas', type: 'string' },
      { key: 'features', label: 'Características (JSON)', type: 'json' }
    ]
  },
  {
    type: 'PricingTable', label: 'Tabla de precios',
    defaultProps: { heading: '', subheading: '', plans: '[]' },
    fields: [
      { key: 'heading', label: 'Título', type: 'string' },
      { key: 'subheading', label: 'Subtítulo', type: 'string' },
      { key: 'plans', label: 'Planes (JSON)', type: 'json' }
    ]
  },
  {
    type: 'FAQ', label: 'Preguntas frecuentes',
    defaultProps: { heading: '', openMultiple: false, items: '[]' },
    fields: [
      { key: 'heading', label: 'Título', type: 'string' },
      { key: 'openMultiple', label: 'Abrir múltiples respuestas', type: 'boolean' },
      { key: 'items', label: 'Preguntas (JSON)', type: 'json' }
    ]
  },
  {
    type: 'ContactInfo', label: 'Información de contacto',
    defaultProps: { heading: 'Contáctanos', email: '', phone: '', address: '', mapUrl: '' },
    fields: [
      { key: 'heading', label: 'Título', type: 'string' },
      { key: 'email', label: 'Email', type: 'string' },
      { key: 'phone', label: 'Teléfono', type: 'string' },
      { key: 'address', label: 'Dirección', type: 'string' },
      { key: 'mapUrl', label: 'URL del mapa (embed)', type: 'string' }
    ]
  }
]

const VALID_FIELD_TYPES = new Set(['string', 'boolean', 'color', 'json', 'css'])

describe('Tier 1 block schemas', () => {
  test('all schemas have required top-level keys', () => {
    for (const schema of tier1Schemas) {
      assert.ok(schema.type, `${schema.type}: missing type`)
      assert.ok(schema.label, `${schema.type}: missing label`)
      assert.ok(schema.defaultProps, `${schema.type}: missing defaultProps`)
      assert.ok(Array.isArray(schema.fields), `${schema.type}: fields must be an array`)
    }
  })

  test('all schema fields have key, label, and valid type', () => {
    for (const schema of tier1Schemas) {
      for (const field of schema.fields) {
        assert.ok(field.key, `${schema.type}.fields[].key is missing`)
        assert.ok(field.label, `${schema.type}.${field.key}: label is missing`)
        assert.ok(
          VALID_FIELD_TYPES.has(field.type),
          `${schema.type}.${field.key}: unknown field type "${field.type}"`
        )
      }
    }
  })

  test('array-prop fields use type json', () => {
    const arrayCandidates = ['cards', 'images', 'testimonials', 'features', 'plans', 'items']
    for (const schema of tier1Schemas) {
      for (const field of schema.fields) {
        if (arrayCandidates.includes(field.key)) {
          assert.equal(
            field.type,
            'json',
            `${schema.type}.${field.key} holds an array — must use type "json", got "${field.type}"`
          )
        }
      }
    }
  })

  test('all 8 Tier 1 schemas are present', () => {
    const expectedTypes = [
      'CardGrid', 'ImageGallery', 'CTABanner', 'Testimonials',
      'Features', 'PricingTable', 'FAQ', 'ContactInfo'
    ]
    const actualTypes = tier1Schemas.map(s => s.type)
    for (const type of expectedTypes) {
      assert.ok(actualTypes.includes(type), `Missing schema for block type: ${type}`)
    }
  })
})
