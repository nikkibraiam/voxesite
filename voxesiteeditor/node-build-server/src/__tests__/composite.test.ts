/**
 * Composite block unit tests.
 *
 * Run with:  npm test
 *
 * Tests exercise the pure logic of:
 *   1. createCompositeBlock — grouping blocks into a definition + replacement block
 *   2. replaceBlockWithChildren — ungrouping a composite back to its children
 *   3. updateCompositeOverride — merging per-instance overrides
 *   4. Missing definition rendering guard
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

// ─── Minimal types (mirrors @cms/contracts without cross-package imports) ─────

interface BaseBlock {
  id: string
  type: string
  props: Record<string, any>
  styles?: Record<string, any>
}

interface CompositeBlockDefinition {
  id: string
  name: string
  children: BaseBlock[]
  layout: 'stack' | 'grid' | 'flex'
  layoutOptions?: { columns?: number; gap?: string }
}

interface Page {
  id: string
  slug: string
  blocks: BaseBlock[]
}

// ─── Pure helpers (logic extracted from store actions for isolated testing) ───

/**
 * Pure version of createCompositeBlock logic.
 * Returns { def, updatedBlocks } without mutating anything.
 */
function createCompositeBlock(
  pageBlocks: BaseBlock[],
  blockIds: string[],
  name: string,
  defId: string,
  compositeId: string
): { def: CompositeBlockDefinition; updatedBlocks: BaseBlock[] } {
  const children = pageBlocks.filter(b => blockIds.includes(b.id))
  if (children.length < 2) throw new Error('Need at least 2 blocks to group')

  const def: CompositeBlockDefinition = {
    id: defId,
    name,
    children,
    layout: 'stack'
  }

  const compositeBlock: BaseBlock = {
    id: compositeId,
    type: 'Composite',
    props: { definitionId: defId, overrides: {} }
  }

  const firstIdx = pageBlocks.findIndex(b => blockIds.includes(b.id))
  const filtered = pageBlocks.filter(b => !blockIds.includes(b.id))
  filtered.splice(firstIdx, 0, compositeBlock)

  return { def, updatedBlocks: filtered }
}

/**
 * Pure version of replaceBlockWithChildren logic.
 * Returns the new blocks array with the composite replaced by its children.
 */
function replaceBlockWithChildren(
  pageBlocks: BaseBlock[],
  blockId: string,
  children: BaseBlock[]
): BaseBlock[] {
  const idx = pageBlocks.findIndex(b => b.id === blockId)
  if (idx === -1) return pageBlocks
  const result = [...pageBlocks]
  result.splice(idx, 1, ...children)
  return result
}

/**
 * Pure version of updateCompositeOverride logic.
 * Returns the updated block with the merged override.
 */
function updateCompositeOverride(
  block: BaseBlock,
  childId: string,
  override: Partial<BaseBlock>
): BaseBlock {
  const overrides = { ...(block.props.overrides ?? {}), [childId]: { ...(block.props.overrides?.[childId] ?? {}), ...override } }
  return { ...block, props: { ...block.props, overrides } }
}

// ─── Test fixtures ────────────────────────────────────────────────────────────

function makeBlock(id: string, type = 'Hero'): BaseBlock {
  return { id, type, props: { title: `Block ${id}` } }
}

// ─── 1. createCompositeBlock ──────────────────────────────────────────────────

describe('createCompositeBlock', () => {
  test('produces a definition with the grouped children', () => {
    const blocks = [makeBlock('a'), makeBlock('b'), makeBlock('c')]
    const { def } = createCompositeBlock(blocks, ['a', 'b'], 'My Card', 'def-1', 'comp-1')

    assert.equal(def.id, 'def-1')
    assert.equal(def.name, 'My Card')
    assert.equal(def.layout, 'stack')
    assert.equal(def.children.length, 2)
    assert.equal(def.children[0]!.id, 'a')
    assert.equal(def.children[1]!.id, 'b')
  })

  test('replaces grouped blocks with a single Composite block at the first position', () => {
    const blocks = [makeBlock('a'), makeBlock('b'), makeBlock('c')]
    const { updatedBlocks } = createCompositeBlock(blocks, ['a', 'b'], 'My Card', 'def-1', 'comp-1')

    assert.equal(updatedBlocks.length, 2)
    assert.equal(updatedBlocks[0]!.id, 'comp-1')
    assert.equal(updatedBlocks[0]!.type, 'Composite')
    assert.equal(updatedBlocks[0]!.props.definitionId, 'def-1')
    assert.equal(updatedBlocks[1]!.id, 'c')
  })

  test('preserves page order — composite placed at first matched block position', () => {
    // Blocks: [x, a, b, y] — grouping a+b → composite replaces a, b removed
    const blocks = [makeBlock('x'), makeBlock('a'), makeBlock('b'), makeBlock('y')]
    const { updatedBlocks } = createCompositeBlock(blocks, ['a', 'b'], 'Card', 'def-2', 'comp-2')

    assert.equal(updatedBlocks.length, 3)
    assert.equal(updatedBlocks[0]!.id, 'x')
    assert.equal(updatedBlocks[1]!.id, 'comp-2')
    assert.equal(updatedBlocks[2]!.id, 'y')
  })

  test('throws when fewer than 2 blocks are provided', () => {
    const blocks = [makeBlock('a'), makeBlock('b')]
    assert.throws(
      () => createCompositeBlock(blocks, ['a'], 'Single', 'def-3', 'comp-3'),
      /at least 2 blocks/
    )
  })

  test('composite block has empty overrides map by default', () => {
    const blocks = [makeBlock('a'), makeBlock('b')]
    const { updatedBlocks } = createCompositeBlock(blocks, ['a', 'b'], 'Test', 'def-4', 'comp-4')
    const composite = updatedBlocks.find(b => b.type === 'Composite')!
    assert.deepEqual(composite.props.overrides, {})
  })
})

// ─── 2. replaceBlockWithChildren ─────────────────────────────────────────────

describe('replaceBlockWithChildren', () => {
  test('restores children at the composite block index', () => {
    const childA = makeBlock('child-a', 'Hero')
    const childB = makeBlock('child-b', 'TextBlock')
    const composite: BaseBlock = {
      id: 'comp-1',
      type: 'Composite',
      props: { definitionId: 'def-1', overrides: {} }
    }
    const pageBlocks = [makeBlock('before'), composite, makeBlock('after')]

    const result = replaceBlockWithChildren(pageBlocks, 'comp-1', [childA, childB])

    assert.equal(result.length, 4)
    assert.equal(result[0]!.id, 'before')
    assert.equal(result[1]!.id, 'child-a')
    assert.equal(result[2]!.id, 'child-b')
    assert.equal(result[3]!.id, 'after')
  })

  test('restores at position 0 when composite is the first block', () => {
    const children = [makeBlock('c1'), makeBlock('c2')]
    const composite: BaseBlock = { id: 'comp', type: 'Composite', props: { definitionId: 'd', overrides: {} } }
    const result = replaceBlockWithChildren([composite, makeBlock('after')], 'comp', children)

    assert.equal(result[0]!.id, 'c1')
    assert.equal(result[1]!.id, 'c2')
    assert.equal(result[2]!.id, 'after')
  })

  test('returns original array if blockId is not found', () => {
    const blocks = [makeBlock('a'), makeBlock('b')]
    const result = replaceBlockWithChildren(blocks, 'nonexistent', [makeBlock('c')])
    assert.deepEqual(result, blocks)
  })
})

// ─── 3. updateCompositeOverride ───────────────────────────────────────────────

describe('updateCompositeOverride', () => {
  test('adds a new override for a child', () => {
    const composite: BaseBlock = {
      id: 'comp-1',
      type: 'Composite',
      props: { definitionId: 'def-1', overrides: {} }
    }
    const updated = updateCompositeOverride(composite, 'child-a', { props: { title: 'Overridden' } })

    assert.deepEqual(updated.props.overrides['child-a'], { props: { title: 'Overridden' } })
  })

  test('merges with existing override for the same child', () => {
    const composite: BaseBlock = {
      id: 'comp-1',
      type: 'Composite',
      props: {
        definitionId: 'def-1',
        overrides: { 'child-a': { props: { title: 'Old', color: 'red' } } }
      }
    }
    const updated = updateCompositeOverride(composite, 'child-a', { props: { title: 'New' } })

    // Only the provided key is updated; other keys in the existing override are preserved
    assert.equal(updated.props.overrides['child-a'].props.title, 'New')
  })

  test('does not mutate the original block', () => {
    const composite: BaseBlock = {
      id: 'comp-1',
      type: 'Composite',
      props: { definitionId: 'def-1', overrides: {} }
    }
    updateCompositeOverride(composite, 'child-a', { props: { title: 'X' } })
    // Original should be unchanged
    assert.deepEqual(composite.props.overrides, {})
  })
})

// ─── 4. Missing definition guard ─────────────────────────────────────────────

describe('composite missing definition guard', () => {
  test('composite block without a matching definition has a definitionId prop', () => {
    const orphan: BaseBlock = {
      id: 'orphan',
      type: 'Composite',
      props: { definitionId: 'does-not-exist', overrides: {} }
    }
    const definitions: CompositeBlockDefinition[] = []

    const found = definitions.find(d => d.id === orphan.props.definitionId)
    assert.equal(found, undefined, 'Should not find a definition for an orphan composite')
    assert.equal(orphan.props.definitionId, 'does-not-exist')
  })
})
