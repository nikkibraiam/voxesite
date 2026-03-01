/**
 * Yjs WebSocket collaboration server.
 *
 * Implements the y-websocket binary protocol so standard WebsocketProvider
 * clients (y-websocket npm package) can connect.
 *
 * Protocol messages:
 *   Type 0 (sync)      — sync-step-1, sync-step-2, incremental update
 *   Type 1 (awareness) — cursor / presence state
 *
 * Each siteId gets its own in-memory Y.Doc + Awareness. On every doc update
 * the state is debounce-persisted to Postgres (collab_state BYTEA column)
 * so a server restart can restore the last known collaborative state.
 */
import * as Y from 'yjs'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import { WebSocketServer } from 'ws'
import type { WebSocket as WsSocket } from 'ws'
import type { IncomingMessage } from 'http'
import type { Pool } from 'pg'

const MESSAGE_SYNC = 0
const MESSAGE_AWARENESS = 1

// ─── Per-document state ───────────────────────────────────────────────────────

interface DocState {
  doc: Y.Doc
  awareness: awarenessProtocol.Awareness
  /** Maps each WebSocket → set of Yjs clientIDs it controls (for awareness cleanup). */
  conns: Map<WsSocket, Set<number>>
  /** Debounce timer for persisting collab_state to Postgres. */
  persistTimer: ReturnType<typeof setTimeout> | null
}

const docStates = new Map<string, DocState>()

function getOrCreateDoc(siteId: string, pool: Pool | null): DocState {
  if (docStates.has(siteId)) return docStates.get(siteId)!

  const doc = new Y.Doc()
  const awareness = new awarenessProtocol.Awareness(doc)
  awareness.setLocalState(null) // Server has no local presence state
  const conns: Map<WsSocket, Set<number>> = new Map()

  const state: DocState = { doc, awareness, conns, persistTimer: null }
  docStates.set(siteId, state)

  // ── Broadcast doc updates to ALL connected clients ────────────────────────
  doc.on('update', (update: Uint8Array) => {
    const enc = encoding.createEncoder()
    encoding.writeVarUint(enc, MESSAGE_SYNC)
    syncProtocol.writeUpdate(enc, update)
    const message = encoding.toUint8Array(enc)

    conns.forEach((_, socket) => {
      if (socket.readyState === socket.OPEN) {
        socket.send(message, (err) => {
          if (err) console.error('[collab] Send error (doc update):', err)
        })
      }
    })

    // Debounce Postgres persistence (500 ms)
    if (pool) {
      if (state.persistTimer) clearTimeout(state.persistTimer)
      state.persistTimer = setTimeout(() => {
        state.persistTimer = null
        const snapshot = Y.encodeStateAsUpdate(doc)
        pool.query(
          `UPDATE sites SET collab_state = $1, updated_at = NOW() WHERE id = $2`,
          [snapshot, siteId]
        ).catch((err: unknown) => console.error(`[collab] Persist error for ${siteId}:`, err))
      }, 500)
    }
  })

  // ── Broadcast awareness changes to ALL connected clients ──────────────────
  awareness.on('update', (
    { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
    origin: unknown
  ) => {
    // Track which Yjs clientIDs each WebSocket controls
    if (origin instanceof Object && conns.has(origin as WsSocket)) {
      const controlled = conns.get(origin as WsSocket)!
      added.forEach(id => controlled.add(id))
      removed.forEach(id => controlled.delete(id))
    }

    const changedClients = [...added, ...updated, ...removed]
    const enc = encoding.createEncoder()
    encoding.writeVarUint(enc, MESSAGE_AWARENESS)
    encoding.writeVarUint8Array(
      enc,
      awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients)
    )
    const message = encoding.toUint8Array(enc)

    conns.forEach((_, socket) => {
      if (socket.readyState === socket.OPEN) {
        socket.send(message, (err) => {
          if (err) console.error('[collab] Send error (awareness):', err)
        })
      }
    })
  })

  return state
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function sendTo(socket: WsSocket, message: Uint8Array) {
  if (socket.readyState === socket.OPEN) {
    socket.send(message, (err) => {
      if (err) console.error('[collab] Send error:', err)
    })
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Wire up the Yjs collaboration server onto `collabWss`.
 *
 * The caller is responsible for routing `/collaboration/*` upgrade requests
 * to this WebSocketServer instance. See server.ts for the routing setup.
 *
 * @param collabWss  WebSocketServer (noServer: true) for collaboration traffic
 * @param pool       Optional pg Pool for Yjs state persistence. May be null.
 */
export function setupCollaborationServer(
  collabWss: WebSocketServer,
  pool: Pool | null
): void {
  collabWss.on('connection', async (socket: WsSocket, request: IncomingMessage) => {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
    // Path format: /collaboration/{siteId}
    const siteId = decodeURIComponent(
      pathname.replace(/^\/collaboration\/?/, '') || 'unknown'
    )

    console.log(`[collab] Client connected: siteId="${siteId}"`)

    const docState = getOrCreateDoc(siteId, pool)
    const { doc, awareness, conns } = docState

    // Register this socket
    conns.set(socket, new Set())

    // ── On first connection for a siteId, restore Yjs state from Postgres ──
    if (pool && conns.size === 1) {
      try {
        const result = await pool.query<{ collab_state: Buffer | null }>(
          `SELECT collab_state FROM sites WHERE id = $1`,
          [siteId]
        )
        const saved = result.rows[0]?.collab_state
        if (saved && saved.length > 0) {
          Y.applyUpdate(doc, new Uint8Array(saved))
          console.log(`[collab] Restored Yjs state from Postgres for "${siteId}"`)
        }
      } catch (err) {
        console.error(`[collab] Failed to load collab_state for "${siteId}":`, err)
      }
    }

    // ── Send sync step 1 (our state vector) to the new client ──────────────
    const step1Enc = encoding.createEncoder()
    encoding.writeVarUint(step1Enc, MESSAGE_SYNC)
    syncProtocol.writeSyncStep1(step1Enc, doc)
    sendTo(socket, encoding.toUint8Array(step1Enc))

    // ── Send current awareness states ────────────────────────────────────────
    const currentStates = awareness.getStates()
    if (currentStates.size > 0) {
      const awareEnc = encoding.createEncoder()
      encoding.writeVarUint(awareEnc, MESSAGE_AWARENESS)
      encoding.writeVarUint8Array(
        awareEnc,
        awarenessProtocol.encodeAwarenessUpdate(awareness, Array.from(currentStates.keys()))
      )
      sendTo(socket, encoding.toUint8Array(awareEnc))
    }

    // ── Handle messages from client ─────────────────────────────────────────
    socket.on('message', (rawData) => {
      try {
        const data = new Uint8Array(
          Buffer.isBuffer(rawData)
            ? rawData
            : Buffer.from(rawData as ArrayBuffer)
        )
        const decoder = decoding.createDecoder(data)
        const enc = encoding.createEncoder()
        const messageType = decoding.readVarUint(decoder)

        if (messageType === MESSAGE_SYNC) {
          encoding.writeVarUint(enc, MESSAGE_SYNC)
          // readSyncMessage applies incoming update/step to doc, writes reply into enc
          syncProtocol.readSyncMessage(decoder, enc, doc, socket)
          // Only send reply if there's payload beyond the message type byte
          if (encoding.length(enc) > 1) {
            sendTo(socket, encoding.toUint8Array(enc))
          }
        } else if (messageType === MESSAGE_AWARENESS) {
          awarenessProtocol.applyAwarenessUpdate(
            awareness,
            decoding.readVarUint8Array(decoder),
            socket
          )
        }
      } catch (err) {
        console.error('[collab] Message processing error:', err)
      }
    })

    // ── Cleanup on disconnect ────────────────────────────────────────────────
    socket.on('close', () => {
      console.log(`[collab] Client disconnected: siteId="${siteId}"`)
      const controlled = conns.get(socket) ?? new Set<number>()
      conns.delete(socket)

      // Remove stale awareness states for this client's controlled IDs
      if (controlled.size > 0) {
        awarenessProtocol.removeAwarenessStates(
          awareness,
          Array.from(controlled),
          null
        )
      }
    })

    socket.on('error', (err) => {
      console.error(`[collab] Socket error for siteId="${siteId}":`, err)
    })
  })

  console.log('[collab] Collaboration server mounted at /collaboration')
}
