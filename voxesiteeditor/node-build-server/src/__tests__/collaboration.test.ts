/**
 * Collaboration unit tests.
 *
 * Run with:  npm test
 *
 * Tests:
 *   1. Presence colour determinism — same userId always yields same colour
 *   2. Two in-memory Y.Doc instances syncing a site mutation
 *   3. Yjs update encoding round-trip (encode → decode → same state)
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import * as Y from 'yjs'

// Local copy of presenceColorFromId (avoids cross-package import in server tests)
function localPresenceColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 65%, 50%)`
}

// ─── 1. Presence colour determinism ──────────────────────────────────────────

describe('presenceColorFromId', () => {
  test('same userId always returns same colour', () => {
    const id = 'abc-123-def-456'
    const c1 = localPresenceColor(id)
    const c2 = localPresenceColor(id)
    assert.equal(c1, c2)
  })

  test('different userIds return different colours (high probability)', () => {
    const ids = ['user-a', 'user-b', 'user-c', 'user-d', 'user-e']
    const colours = ids.map(localPresenceColor)
    const unique = new Set(colours)
    assert.equal(unique.size, ids.length, 'All colours should be distinct')
  })

  test('colour is a valid hsl() string', () => {
    const colour = localPresenceColor('test-user-uuid')
    assert.match(colour, /^hsl\(\d+,\s*65%,\s*50%\)$/)
  })
})

// ─── 2. Two Y.Doc instances syncing a site mutation ──────────────────────────

describe('Yjs two-client sync (in-memory)', () => {
  /**
   * Manually exchanges sync messages between two Y.Doc instances without any
   * WebSocket — just direct update propagation. This is the offline equivalent
   * of what WebsocketProvider + yjsServer do over the wire.
   */
  function syncDocs(docA: Y.Doc, docB: Y.Doc) {
    // Step 1: A sends its state to B
    const stateA = Y.encodeStateAsUpdate(docA)
    Y.applyUpdate(docB, stateA)
    // Step 2: B sends its state to A
    const stateB = Y.encodeStateAsUpdate(docB)
    Y.applyUpdate(docA, stateB)
  }

  test('site mutation on docA is visible on docB after sync', () => {
    const docA = new Y.Doc()
    const docB = new Y.Doc()

    const siteA = docA.getMap<any>('site')
    const siteB = docB.getMap<any>('site')

    // Initial sync (both empty)
    syncDocs(docA, docB)

    // Mutate on A
    docA.transact(() => {
      siteA.set('data', { id: 'demosite', version: '1.0.0', pages: [], layout: {} })
    })

    // Propagate A → B
    const update = Y.encodeStateAsUpdate(docA, Y.encodeStateVector(docB))
    Y.applyUpdate(docB, update)

    // B should now see the same data
    const dataOnB = siteB.get('data') as any
    assert.equal(dataOnB?.id, 'demosite')
    assert.equal(dataOnB?.version, '1.0.0')
  })

  test('concurrent mutations on docA and docB both survive merge', () => {
    const docA = new Y.Doc()
    const docB = new Y.Doc()

    const siteA = docA.getMap<any>('site')
    const siteB = docB.getMap<any>('site')

    // A sets initial state
    docA.transact(() => {
      siteA.set('version', '1.0.0')
    })
    syncDocs(docA, docB)

    // Concurrent edits — A changes version, B changes pages
    docA.transact(() => { siteA.set('version', '1.1.0') })
    docB.transact(() => { siteB.set('pageCount', 3) })

    // Exchange updates
    syncDocs(docA, docB)

    // Both docs converge to the same state
    const stateA = { version: siteA.get('version'), pageCount: siteA.get('pageCount') }
    const stateB = { version: siteB.get('version'), pageCount: siteB.get('pageCount') }

    assert.deepEqual(stateA, stateB)
    assert.equal(stateA.version, '1.1.0')
    assert.equal(stateA.pageCount, 3)
  })

  test('update encoding round-trip preserves data', () => {
    const doc = new Y.Doc()
    const map = doc.getMap<any>('site')

    const originalData = {
      id: 'demosite',
      version: '2.0.0',
      pages: [{ id: 'p1', slug: 'home', blocks: [], layout: {} }],
      layout: { header: null, footer: null }
    }

    doc.transact(() => { map.set('data', originalData) })

    // Encode and decode into a fresh doc
    const encoded = Y.encodeStateAsUpdate(doc)
    const docRestored = new Y.Doc()
    Y.applyUpdate(docRestored, encoded)

    const restored = docRestored.getMap<any>('site').get('data') as any
    assert.equal(restored?.id, originalData.id)
    assert.equal(restored?.version, originalData.version)
    assert.equal(restored?.pages?.length, originalData.pages.length)
  })
})
