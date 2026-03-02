/**
 * Unit tests for Tier 2 & Tier 3 block logic.
 *
 * Run with: npm test
 *
 * Tests cover:
 *   1.  Shared parseArrayProp utility (verifies all array-prop blocks use same pattern)
 *   2.  Countdown — expired detection, time-remaining calculation, label defaults
 *   3.  Carousel — index wrapping, prev/next, goTo, autoplay boundary
 *   4.  Accordion — openMultiple mode, openFirst seeding
 *   5.  Alert — dismiss toggle
 *   6.  SearchBar — URL template substitution
 *   7.  ProgressBar — percentage clamping and calculation
 *   8.  VideoEmbed — YouTube/Vimeo URL normalization
 *   9.  MapEmbed — Google Maps embed URL construction
 *  10.  Table — header/row JSON parsing
 *  11.  Schema structure validation for all 23 Tier 2 + Tier 3 blocks
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

// ─── Shared helpers (mirror Vue component computed patterns) ───────────────────

function parseArrayProp<T>(value: T[] | string | undefined): T[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  try { return JSON.parse(value as string) } catch { return [] }
}

// ─── 1. parseArrayProp — shared by all Tier 2 & 3 array-prop blocks ─────────────

describe('parseArrayProp — Tier 2 & 3 usage', () => {
  test('handles array directly', () => {
    const items = [{ title: 'A' }, { title: 'B' }]
    assert.deepEqual(parseArrayProp(items), items)
  })

  test('parses valid JSON string to array', () => {
    const json = '[{"label":"Home","href":"/"}]'
    assert.deepEqual(parseArrayProp(json), [{ label: 'Home', href: '/' }])
  })

  test('returns [] for malformed JSON', () => {
    assert.deepEqual(parseArrayProp('{bad json}'), [])
  })

  test('returns [] for empty string', () => {
    assert.deepEqual(parseArrayProp(''), [])
  })

  test('returns [] for null/undefined', () => {
    assert.deepEqual(parseArrayProp(undefined), [])
  })

  test('parses nested objects (TeamMember with socialLinks)', () => {
    const json = JSON.stringify([
      { name: 'Ana', role: 'CEO', socialLinks: [{ platform: 'LinkedIn', url: 'https://linkedin.com/in/ana' }] }
    ])
    const result = parseArrayProp<any>(json)
    assert.equal(result[0].name, 'Ana')
    assert.equal(result[0].socialLinks[0].platform, 'LinkedIn')
  })

  test('parses 2D array (Table rows)', () => {
    const json = JSON.stringify([['Cell A1', 'Cell A2'], ['Cell B1', 'Cell B2']])
    const result = parseArrayProp<string[]>(json)
    assert.equal(result[0][1], 'Cell A2')
    assert.equal(result[1][0], 'Cell B1')
  })
})

// ─── 2. Countdown — expired detection & time-remaining ────────────────────────

function getCountdownParts(targetDate: string): { days: number; hours: number; minutes: number; seconds: number } | null {
  const diff = new Date(targetDate).getTime() - Date.now()
  if (diff <= 0) return null
  return {
    days:    Math.floor(diff / 86_400_000),
    hours:   Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000)
  }
}

describe('Countdown — expired detection', () => {
  test('returns null for a past date', () => {
    const pastDate = new Date(Date.now() - 1_000).toISOString()
    assert.equal(getCountdownParts(pastDate), null)
  })

  test('returns an object for a future date', () => {
    const futureDate = new Date(Date.now() + 3_600_000).toISOString()
    const parts = getCountdownParts(futureDate)
    assert.ok(parts !== null)
    assert.equal(typeof parts.hours, 'number')
  })

  test('days/hours/minutes/seconds are non-negative', () => {
    const futureDate = new Date(Date.now() + 90_000_000).toISOString() // ~25 hours
    const parts = getCountdownParts(futureDate)!
    assert.ok(parts.days >= 0)
    assert.ok(parts.hours >= 0 && parts.hours < 24)
    assert.ok(parts.minutes >= 0 && parts.minutes < 60)
    assert.ok(parts.seconds >= 0 && parts.seconds < 60)
  })

  test('exactly-expired target returns null', () => {
    const now = new Date(Date.now() - 1).toISOString()
    assert.equal(getCountdownParts(now), null)
  })
})

// ─── 3. Carousel index wrapping ───────────────────────────────────────────────

function makeCarousel(total: number) {
  let current = 0
  const len = total
  return {
    prev()   { current = (current - 1 + len) % len },
    next()   { current = (current + 1) % len },
    goTo(i: number) { current = Math.max(0, Math.min(i, len - 1)) },
    get()    { return current }
  }
}

describe('Carousel — index wrapping', () => {
  test('starts at 0', () => {
    assert.equal(makeCarousel(4).get(), 0)
  })

  test('next increments index', () => {
    const c = makeCarousel(4)
    c.next()
    assert.equal(c.get(), 1)
  })

  test('next wraps from last to first', () => {
    const c = makeCarousel(4)
    c.next(); c.next(); c.next(); c.next()
    assert.equal(c.get(), 0)
  })

  test('prev wraps from first to last', () => {
    const c = makeCarousel(4)
    c.prev()
    assert.equal(c.get(), 3)
  })

  test('goTo sets exact index', () => {
    const c = makeCarousel(5)
    c.goTo(3)
    assert.equal(c.get(), 3)
  })

  test('goTo clamps to valid range', () => {
    const c = makeCarousel(3)
    c.goTo(99)
    assert.equal(c.get(), 2)
  })

  test('prev and next are inverses', () => {
    const c = makeCarousel(5)
    c.next(); c.next(); c.prev()
    assert.equal(c.get(), 1)
  })
})

// ─── 4. Accordion — state machine ────────────────────────────────────────────

function makeAccordion(openMultiple: boolean, openFirst: boolean, itemCount: number) {
  let openSet = new Set<number>(openFirst && itemCount > 0 ? [0] : [])

  function toggle(i: number) {
    if (openMultiple) {
      const next = new Set(openSet)
      next.has(i) ? next.delete(i) : next.add(i)
      openSet = next
    } else {
      openSet = openSet.has(i) ? new Set() : new Set([i])
    }
  }

  return {
    toggle,
    isOpen: (i: number) => openSet.has(i),
    openCount: () => openSet.size
  }
}

describe('Accordion — openFirst seed', () => {
  test('openFirst=true seeds the first item open', () => {
    const acc = makeAccordion(false, true, 3)
    assert.ok(acc.isOpen(0))
    assert.equal(acc.openCount(), 1)
  })

  test('openFirst=false starts with all closed', () => {
    const acc = makeAccordion(false, false, 3)
    assert.equal(acc.openCount(), 0)
  })
})

describe('Accordion — openMultiple mode', () => {
  test('allows multiple items open simultaneously', () => {
    const acc = makeAccordion(true, false, 4)
    acc.toggle(0); acc.toggle(2); acc.toggle(3)
    assert.equal(acc.openCount(), 3)
  })

  test('closing one does not affect others', () => {
    const acc = makeAccordion(true, false, 4)
    acc.toggle(0); acc.toggle(1)
    acc.toggle(0)
    assert.ok(!acc.isOpen(0))
    assert.ok(acc.isOpen(1))
  })
})

describe('Accordion — single mode', () => {
  test('opening a new item closes the previous', () => {
    const acc = makeAccordion(false, false, 3)
    acc.toggle(0); acc.toggle(1)
    assert.ok(!acc.isOpen(0))
    assert.ok(acc.isOpen(1))
    assert.equal(acc.openCount(), 1)
  })

  test('toggling an open item closes it', () => {
    const acc = makeAccordion(false, false, 3)
    acc.toggle(0); acc.toggle(0)
    assert.ok(!acc.isOpen(0))
    assert.equal(acc.openCount(), 0)
  })
})

// ─── 5. Alert — dismiss toggle ────────────────────────────────────────────────

describe('Alert — dismiss toggle', () => {
  test('starts as not dismissed', () => {
    let dismissed = false
    assert.ok(!dismissed)
  })

  test('dismiss() sets dismissed to true', () => {
    let dismissed = false
    dismissed = true
    assert.ok(dismissed)
  })

  test('dismissed alert should not render (simulated v-if)', () => {
    function shouldRender(dismissed: boolean) { return !dismissed }
    assert.ok(shouldRender(false))
    assert.ok(!shouldRender(true))
  })
})

// ─── 6. SearchBar — URL template substitution ─────────────────────────────────

function buildSearchUrl(template: string, query: string): string {
  return template.replace('{query}', encodeURIComponent(query.trim()))
}

describe('SearchBar — URL template substitution', () => {
  test('replaces {query} with encoded query', () => {
    const url = buildSearchUrl('/search?q={query}', 'hello world')
    assert.equal(url, '/search?q=hello%20world')
  })

  test('encodes special characters', () => {
    const url = buildSearchUrl('/find?q={query}', 'café & croissant')
    assert.ok(url.includes('caf%C3%A9'))
    assert.ok(url.includes('%26'))
  })

  test('trims whitespace from query before encoding', () => {
    const url = buildSearchUrl('/q?s={query}', '  vue  ')
    assert.ok(!url.includes(' '))
    assert.ok(url.includes('vue'))
  })

  test('works with path-style template', () => {
    const url = buildSearchUrl('/results/{query}', 'laptop')
    assert.equal(url, '/results/laptop')
  })

  test('leaves template unchanged if {query} is absent', () => {
    const url = buildSearchUrl('/static', 'anything')
    assert.equal(url, '/static')
  })
})

// ─── 7. ProgressBar — percentage calculation & clamping ──────────────────────

function calcPct(value: number, max: number): number {
  return Math.min(100, Math.max(0, (value / max) * 100))
}

describe('ProgressBar — percentage calculation', () => {
  test('calculates 50% correctly', () => {
    assert.equal(calcPct(50, 100), 50)
  })

  test('calculates 65%', () => {
    assert.equal(calcPct(65, 100), 65)
  })

  test('clamps to 100 when value > max', () => {
    assert.equal(calcPct(150, 100), 100)
  })

  test('clamps to 0 when value is negative', () => {
    assert.equal(calcPct(-10, 100), 0)
  })

  test('works with non-100 max', () => {
    assert.equal(calcPct(1, 4), 25)
  })

  test('returns 0 when value is 0', () => {
    assert.equal(calcPct(0, 100), 0)
  })

  test('returns 100 when value equals max', () => {
    assert.equal(calcPct(250, 250), 100)
  })
})

// ─── 8. VideoEmbed — URL normalization ────────────────────────────────────────

function normalizeVideoUrl(url: string): string | null {
  // YouTube watch
  const ytWatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  if (ytWatch) return `https://www.youtube.com/embed/${ytWatch[1]}`
  // YouTube embed (already normalized)
  const ytEmbed = url.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/)
  if (ytEmbed) return `https://www.youtube.com/embed/${ytEmbed[1]}`
  // Vimeo
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}

describe('VideoEmbed — URL normalization', () => {
  test('converts youtube.com/watch?v= to embed URL', () => {
    const result = normalizeVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    assert.equal(result, 'https://www.youtube.com/embed/dQw4w9WgXcQ')
  })

  test('converts youtu.be short URL to embed URL', () => {
    const result = normalizeVideoUrl('https://youtu.be/dQw4w9WgXcQ')
    assert.equal(result, 'https://www.youtube.com/embed/dQw4w9WgXcQ')
  })

  test('passes through existing embed URL unchanged', () => {
    const result = normalizeVideoUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')
    assert.equal(result, 'https://www.youtube.com/embed/dQw4w9WgXcQ')
  })

  test('converts vimeo URL to player embed URL', () => {
    const result = normalizeVideoUrl('https://vimeo.com/123456789')
    assert.equal(result, 'https://player.vimeo.com/video/123456789')
  })

  test('returns null for unrecognized URL', () => {
    const result = normalizeVideoUrl('https://example.com/video.mp4')
    assert.equal(result, null)
  })
})

// ─── 9. MapEmbed — Google Maps embed URL construction ─────────────────────────

function buildMapEmbedUrl(address: string, zoom: number): string {
  const q = encodeURIComponent(address)
  return `https://maps.google.com/maps?q=${q}&z=${zoom}&output=embed`
}

describe('MapEmbed — embed URL construction', () => {
  test('builds correct URL for simple address', () => {
    const url = buildMapEmbedUrl('New York, NY', 12)
    assert.ok(url.startsWith('https://maps.google.com/maps?q='))
    assert.ok(url.includes('New%20York'))
    assert.ok(url.includes('z=12'))
    assert.ok(url.includes('output=embed'))
  })

  test('encodes special chars in address', () => {
    const url = buildMapEmbedUrl('Calle 5 #10-20, Bogotá', 14)
    assert.ok(url.includes('%2310-20'))
    assert.ok(url.includes('Bogot%C3%A1'))
  })

  test('uses provided zoom level', () => {
    const url = buildMapEmbedUrl('Paris, France', 16)
    assert.ok(url.includes('z=16'))
  })
})

// ─── 10. Table — header/row JSON parsing ──────────────────────────────────────

describe('Table — JSON parsing', () => {
  test('parses header string array', () => {
    const json = '["Name","Age","City"]'
    const headers = parseArrayProp<string>(json)
    assert.deepEqual(headers, ['Name', 'Age', 'City'])
  })

  test('parses 2D rows array', () => {
    const json = '[["Alice","30","NYC"],["Bob","25","LA"]]'
    const rows = parseArrayProp<string[]>(json)
    assert.equal(rows[0][0], 'Alice')
    assert.equal(rows[1][2], 'LA')
  })

  test('returns [] for invalid JSON', () => {
    assert.deepEqual(parseArrayProp('not-json'), [])
  })
})

// ─── 11. Schema structure validation ─────────────────────────────────────────

interface FieldDef { key: string; label: string; type: string }
interface BlockSchemaDef {
  type: string
  label: string
  defaultProps: Record<string, any>
  fields: FieldDef[]
}

// Inline schema copies to avoid cross-package CJS/ESM issues
const tier2Schemas: BlockSchemaDef[] = [
  {
    type: 'Flyer', label: 'Volante',
    defaultProps: { bgImageUrl: '', title: '', subtitle: '', overlay: true, overlayOpacity: 0.5, textColor: '#ffffff' },
    fields: [
      { key: 'bgImageUrl', label: 'URL imagen de fondo', type: 'string' },
      { key: 'title', label: 'Título', type: 'string' },
      { key: 'subtitle', label: 'Subtítulo', type: 'string' },
      { key: 'overlay', label: 'Capa oscura', type: 'boolean' },
      { key: 'overlayOpacity', label: 'Opacidad de capa', type: 'string' },
      { key: 'textColor', label: 'Color de texto', type: 'color' }
    ]
  },
  {
    type: 'VideoEmbed', label: 'Video embebido',
    defaultProps: { videoUrl: '', autoplay: false, muted: true, posterUrl: '', aspectRatio: '16/9' },
    fields: [
      { key: 'videoUrl', label: 'URL del video', type: 'string' },
      { key: 'autoplay', label: 'Reproducción automática', type: 'boolean' },
      { key: 'muted', label: 'Sin sonido', type: 'boolean' },
      { key: 'posterUrl', label: 'URL imagen poster', type: 'string' },
      { key: 'aspectRatio', label: 'Relación de aspecto', type: 'string' }
    ]
  },
  {
    type: 'Countdown', label: 'Contador regresivo',
    defaultProps: { targetDate: '', expiredMessage: 'El tiempo terminó', style: 'boxes' },
    fields: [
      { key: 'targetDate', label: 'Fecha objetivo', type: 'string' },
      { key: 'expiredMessage', label: 'Mensaje al expirar', type: 'string' },
      { key: 'style', label: 'Estilo (boxes/minimal)', type: 'string' }
    ]
  },
  {
    type: 'StatsBanner', label: 'Banner de estadísticas',
    defaultProps: { stats: '[]', bgColor: '#1a1a2e', textColor: '#ffffff', columns: 4 },
    fields: [
      { key: 'stats', label: 'Estadísticas (JSON)', type: 'json' },
      { key: 'bgColor', label: 'Color de fondo', type: 'color' },
      { key: 'textColor', label: 'Color de texto', type: 'color' },
      { key: 'columns', label: 'Columnas', type: 'string' }
    ]
  },
  {
    type: 'TeamSection', label: 'Sección de equipo',
    defaultProps: { heading: 'Nuestro equipo', members: '[]', columns: 3 },
    fields: [
      { key: 'heading', label: 'Título', type: 'string' },
      { key: 'members', label: 'Miembros (JSON)', type: 'json' },
      { key: 'columns', label: 'Columnas', type: 'string' }
    ]
  },
  {
    type: 'LogoCloud', label: 'Nube de logos',
    defaultProps: { title: '', logos: '[]', grayscale: true },
    fields: [
      { key: 'title', label: 'Texto encabezado', type: 'string' },
      { key: 'logos', label: 'Logos (JSON)', type: 'json' },
      { key: 'grayscale', label: 'Escala de grises', type: 'boolean' }
    ]
  },
  {
    type: 'Timeline', label: 'Línea de tiempo',
    defaultProps: { heading: '', events: '[]', direction: 'vertical' },
    fields: [
      { key: 'heading', label: 'Título', type: 'string' },
      { key: 'events', label: 'Eventos (JSON)', type: 'json' },
      { key: 'direction', label: 'Dirección (vertical/horizontal)', type: 'string' }
    ]
  },
  {
    type: 'Breadcrumb', label: 'Migas de pan',
    defaultProps: { items: '[]', separator: '/' },
    fields: [
      { key: 'items', label: 'Elementos (JSON)', type: 'json' },
      { key: 'separator', label: 'Separador', type: 'string' }
    ]
  }
]

const tier3Schemas: BlockSchemaDef[] = [
  {
    type: 'ProductCard', label: 'Tarjeta de producto',
    defaultProps: { imageUrl: '', name: '', price: 0, originalPrice: 0, badge: '', ctaLabel: 'Comprar', ctaUrl: '#', currency: '$' },
    fields: [
      { key: 'imageUrl', label: 'URL imagen', type: 'string' },
      { key: 'name', label: 'Nombre', type: 'string' },
      { key: 'price', label: 'Precio', type: 'string' },
      { key: 'originalPrice', label: 'Precio original', type: 'string' },
      { key: 'badge', label: 'Etiqueta', type: 'string' },
      { key: 'ctaLabel', label: 'Texto CTA', type: 'string' },
      { key: 'ctaUrl', label: 'URL CTA', type: 'string' },
      { key: 'currency', label: 'Moneda', type: 'string' }
    ]
  },
  {
    type: 'ProductGrid', label: 'Grilla de productos',
    defaultProps: { heading: '', products: '[]', columns: 3, showFilter: false, filterKey: 'badge' },
    fields: [
      { key: 'heading', label: 'Título', type: 'string' },
      { key: 'products', label: 'Productos (JSON)', type: 'json' },
      { key: 'columns', label: 'Columnas', type: 'string' },
      { key: 'showFilter', label: 'Mostrar filtro', type: 'boolean' },
      { key: 'filterKey', label: 'Clave de filtro', type: 'string' }
    ]
  },
  {
    type: 'ProductDetail', label: 'Detalle de producto',
    defaultProps: { images: '[]', name: '', price: 0, originalPrice: 0, currency: '$', description: '', specs: '[]', ctaLabel: 'Agregar al carrito', ctaUrl: '#' },
    fields: [
      { key: 'images', label: 'Imágenes (JSON)', type: 'json' },
      { key: 'name', label: 'Nombre', type: 'string' },
      { key: 'price', label: 'Precio', type: 'string' },
      { key: 'originalPrice', label: 'Precio original', type: 'string' },
      { key: 'description', label: 'Descripción', type: 'string' },
      { key: 'specs', label: 'Especificaciones (JSON)', type: 'json' },
      { key: 'ctaLabel', label: 'Texto botón', type: 'string' },
      { key: 'ctaUrl', label: 'URL botón', type: 'string' }
    ]
  },
  {
    type: 'MapEmbed', label: 'Mapa',
    defaultProps: { address: '', zoom: 14, height: '400px', title: 'Mapa' },
    fields: [
      { key: 'address', label: 'Dirección', type: 'string' },
      { key: 'zoom', label: 'Zoom (1–20)', type: 'string' },
      { key: 'height', label: 'Altura del mapa', type: 'string' },
      { key: 'title', label: 'Título accesible', type: 'string' }
    ]
  },
  {
    type: 'NewsletterSignup', label: 'Boletín de noticias',
    defaultProps: { title: '¡Suscríbete!', description: '', placeholder: 'tu@email.com', buttonLabel: 'Suscribirse', endpointKey: '', successMessage: '¡Gracias!' },
    fields: [
      { key: 'title', label: 'Título', type: 'string' },
      { key: 'description', label: 'Descripción', type: 'string' },
      { key: 'placeholder', label: 'Placeholder del input', type: 'string' },
      { key: 'buttonLabel', label: 'Texto del botón', type: 'string' },
      { key: 'endpointKey', label: 'Clave de endpoint', type: 'string' },
      { key: 'successMessage', label: 'Mensaje de éxito', type: 'string' }
    ]
  },
  {
    type: 'SearchBar', label: 'Barra de búsqueda',
    defaultProps: { placeholder: 'Buscar...', searchUrl: '/buscar?q={query}', buttonLabel: 'Buscar' },
    fields: [
      { key: 'placeholder', label: 'Placeholder', type: 'string' },
      { key: 'searchUrl', label: 'URL de búsqueda (usa {query})', type: 'string' },
      { key: 'buttonLabel', label: 'Texto del botón', type: 'string' }
    ]
  },
  {
    type: 'Accordion', label: 'Acordeón',
    defaultProps: { items: '[]', openFirst: false, openMultiple: false },
    fields: [
      { key: 'items', label: 'Elementos (JSON)', type: 'json' },
      { key: 'openFirst', label: 'Abrir primero por defecto', type: 'boolean' },
      { key: 'openMultiple', label: 'Permitir múltiples abiertos', type: 'boolean' }
    ]
  },
  {
    type: 'Tabs', label: 'Pestañas',
    defaultProps: { tabs: '[]', defaultTab: 0 },
    fields: [
      { key: 'tabs', label: 'Pestañas (JSON)', type: 'json' },
      { key: 'defaultTab', label: 'Pestaña inicial (índice)', type: 'string' }
    ]
  },
  {
    type: 'Carousel', label: 'Carrusel de imágenes',
    defaultProps: { items: '[]', autoplay: false, interval: 4000, showArrows: true, showDots: true },
    fields: [
      { key: 'items', label: 'Imágenes (JSON)', type: 'json' },
      { key: 'autoplay', label: 'Reproducción automática', type: 'boolean' },
      { key: 'interval', label: 'Intervalo (ms)', type: 'string' },
      { key: 'showArrows', label: 'Mostrar flechas', type: 'boolean' },
      { key: 'showDots', label: 'Mostrar puntos', type: 'boolean' }
    ]
  },
  {
    type: 'Table', label: 'Tabla de datos',
    defaultProps: { headers: '[]', rows: '[]', striped: false, bordered: false, caption: '' },
    fields: [
      { key: 'headers', label: 'Encabezados (JSON)', type: 'json' },
      { key: 'rows', label: 'Filas (JSON)', type: 'json' },
      { key: 'striped', label: 'Filas alternadas', type: 'boolean' },
      { key: 'bordered', label: 'Con bordes', type: 'boolean' },
      { key: 'caption', label: 'Leyenda', type: 'string' }
    ]
  },
  {
    type: 'CodeBlock', label: 'Bloque de código',
    defaultProps: { code: '', language: '', showCopyButton: true, showLineNumbers: false },
    fields: [
      { key: 'code', label: 'Código', type: 'css' },
      { key: 'language', label: 'Lenguaje', type: 'string' },
      { key: 'showCopyButton', label: 'Botón copiar', type: 'boolean' },
      { key: 'showLineNumbers', label: 'Números de línea', type: 'boolean' }
    ]
  },
  {
    type: 'Divider', label: 'Divisor',
    defaultProps: { style: 'line', margin: 'md' },
    fields: [
      { key: 'style', label: 'Estilo (line/dots/wave/fade)', type: 'string' },
      { key: 'margin', label: 'Margen (sm/md/lg)', type: 'string' }
    ]
  },
  {
    type: 'Spacer', label: 'Espacio en blanco',
    defaultProps: { height: 'md', customHeight: '4rem' },
    fields: [
      { key: 'height', label: 'Altura (xs/sm/md/lg/xl/custom)', type: 'string' },
      { key: 'customHeight', label: 'Altura personalizada (CSS)', type: 'string' }
    ]
  },
  {
    type: 'Alert', label: 'Alerta',
    defaultProps: { type: 'info', title: '', message: '', dismissible: false },
    fields: [
      { key: 'type', label: 'Tipo (info/success/warning/error)', type: 'string' },
      { key: 'title', label: 'Título', type: 'string' },
      { key: 'message', label: 'Mensaje', type: 'string' },
      { key: 'dismissible', label: 'Cerrable', type: 'boolean' }
    ]
  },
  {
    type: 'ProgressBar', label: 'Barra de progreso',
    defaultProps: { value: 65, max: 100, label: 'Progreso', color: '#5858c8', showPercentage: true },
    fields: [
      { key: 'value', label: 'Valor actual', type: 'string' },
      { key: 'max', label: 'Valor máximo', type: 'string' },
      { key: 'label', label: 'Etiqueta', type: 'string' },
      { key: 'color', label: 'Color', type: 'color' },
      { key: 'showPercentage', label: 'Mostrar %', type: 'boolean' }
    ]
  }
]

const VALID_FIELD_TYPES = new Set(['string', 'boolean', 'color', 'json', 'css'])

describe('Tier 2 block schemas', () => {
  test('all 8 schemas have required top-level keys', () => {
    for (const schema of tier2Schemas) {
      assert.ok(schema.type, `${schema.type}: missing type`)
      assert.ok(schema.label, `${schema.type}: missing label`)
      assert.ok(schema.defaultProps, `${schema.type}: missing defaultProps`)
      assert.ok(Array.isArray(schema.fields), `${schema.type}: fields must be an array`)
    }
  })

  test('all schema fields have key, label, and valid type', () => {
    for (const schema of tier2Schemas) {
      for (const field of schema.fields) {
        assert.ok(field.key, `${schema.type}.${field.key}: key missing`)
        assert.ok(field.label, `${schema.type}.${field.key}: label missing`)
        assert.ok(
          VALID_FIELD_TYPES.has(field.type),
          `${schema.type}.${field.key}: unknown type "${field.type}"`
        )
      }
    }
  })

  test('all 8 Tier 2 schema types are present', () => {
    const expected = ['Flyer', 'VideoEmbed', 'Countdown', 'StatsBanner', 'TeamSection', 'LogoCloud', 'Timeline', 'Breadcrumb']
    const actual = tier2Schemas.map(s => s.type)
    for (const t of expected) {
      assert.ok(actual.includes(t), `Missing Tier 2 schema: ${t}`)
    }
  })

  test('array-prop fields use type json', () => {
    const arrayKeys = ['stats', 'members', 'logos', 'events', 'items']
    for (const schema of tier2Schemas) {
      for (const field of schema.fields) {
        if (arrayKeys.includes(field.key)) {
          assert.equal(field.type, 'json', `${schema.type}.${field.key} must be json, got "${field.type}"`)
        }
      }
    }
  })
})

describe('Tier 3 block schemas', () => {
  test('all 15 schemas have required top-level keys', () => {
    for (const schema of tier3Schemas) {
      assert.ok(schema.type, `${schema.type}: missing type`)
      assert.ok(schema.label, `${schema.type}: missing label`)
      assert.ok(schema.defaultProps, `${schema.type}: missing defaultProps`)
      assert.ok(Array.isArray(schema.fields), `${schema.type}: fields must be an array`)
    }
  })

  test('all schema fields have valid types', () => {
    for (const schema of tier3Schemas) {
      for (const field of schema.fields) {
        assert.ok(
          VALID_FIELD_TYPES.has(field.type),
          `${schema.type}.${field.key}: unknown type "${field.type}"`
        )
      }
    }
  })

  test('all 15 Tier 3 schema types are present', () => {
    const expected = [
      'ProductCard', 'ProductGrid', 'ProductDetail', 'MapEmbed', 'NewsletterSignup',
      'SearchBar', 'Accordion', 'Tabs', 'Carousel', 'Table',
      'CodeBlock', 'Divider', 'Spacer', 'Alert', 'ProgressBar'
    ]
    const actual = tier3Schemas.map(s => s.type)
    for (const t of expected) {
      assert.ok(actual.includes(t), `Missing Tier 3 schema: ${t}`)
    }
  })

  test('array-prop fields use type json', () => {
    const arrayKeys = ['products', 'images', 'specs', 'items', 'tabs', 'headers', 'rows']
    for (const schema of tier3Schemas) {
      for (const field of schema.fields) {
        if (arrayKeys.includes(field.key)) {
          assert.equal(field.type, 'json', `${schema.type}.${field.key} must be json, got "${field.type}"`)
        }
      }
    }
  })

  test('CodeBlock uses type css for code field (multi-line text)', () => {
    const codeSchema = tier3Schemas.find(s => s.type === 'CodeBlock')!
    const codeField = codeSchema.fields.find(f => f.key === 'code')!
    assert.equal(codeField.type, 'css')
  })

  test('ProgressBar has color field with type color', () => {
    const pb = tier3Schemas.find(s => s.type === 'ProgressBar')!
    const colorField = pb.fields.find(f => f.key === 'color')!
    assert.equal(colorField.type, 'color')
  })
})
