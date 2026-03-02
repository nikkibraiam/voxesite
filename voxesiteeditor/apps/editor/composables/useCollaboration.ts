/**
 * useCollaboration — Yjs + Pinia bidirectional sync.
 *
 * Creates a Y.Doc keyed on `siteId`, connects to the Yjs WebSocket server
 * via WebsocketProvider, and keeps `store.site` ↔ Y.Map('site') in sync:
 *
 *   Remote Yjs update  →  store.setSite()        (no undo history)
 *   Local store change →  Y.Map.set() debounced  (100 ms, suppressed on remote)
 *
 * Presence (UserPresence) is broadcast through the awareness protocol.
 * Whenever connected users' awareness changes the composable sends a
 * PRESENCE_UPDATE postMessage to the runtime iframe so blocks can be
 * highlighted with peer colours.
 *
 * Call once from index.vue (top of setup). Calling it multiple times
 * creates separate providers — which is intentional for multi-site use,
 * but for this single-site editor one call is enough.
 */
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { usePageStore } from '../stores/usePageStore'
import { sendEditorMessage } from '@cms/contracts'
import { presenceColorFromId } from '@cms/contracts'
import type { UserPresence } from '@cms/contracts'
import type { Site } from '@cms/contracts'

export function useCollaboration(
  siteId: string,
  previewFrameRef: { value: HTMLIFrameElement | null }
) {
  const store = usePageStore()
  const config = useRuntimeConfig()

  // ── Local user identity (random per session, not persisted) ───────────────
  const userId = crypto.randomUUID()
  const localUser = ref<UserPresence>({
    userId,
    displayName: `User-${userId.slice(0, 4)}`,
    color: presenceColorFromId(userId),
    selectedBlockId: null,
    selectedLayoutBlockId: null,
    lastSeen: Date.now()
  })

  // ── Connected peers (all remote users) ───────────────────────────────────
  const connectedUsers = ref<UserPresence[]>([])
  const isConnected = ref(false)

  // ── Suppress-sync flag — prevents local→remote echo ──────────────────────
  // Must be a plain boolean (not ref) so reads are synchronous inside watch callbacks.
  let _suppressSync = false
  let _syncTimer: ReturnType<typeof setTimeout> | null = null

  // Yjs + WebsocketProvider are browser-only — initialized inside onMounted
  // so they never run during SSR (which would hang the Nitro request handler).
  let _stopSiteWatch: (() => void) | null = null
  let _stopSelectionWatch: (() => void) | null = null
  let _provider: any = null

  const wsBase = (config.public.wsUrl as string | undefined) ?? 'ws://localhost:2999'

  onMounted(async () => {
    // Dynamic imports keep Yjs / y-websocket out of the SSR bundle entirely.
    const Y = await import('yjs')
    const { WebsocketProvider } = await import('y-websocket')

    // ── Yjs document ───────────────────────────────────────────────────────
    const ydoc = new Y.Doc()
    const ysite = ydoc.getMap<Site>('site')

    // Seed the Y.Doc with the current Pinia state so the server receives full
    // site data on the first sync-step-2 exchange.
    if (store.site) {
      ydoc.transact(() => {
        ysite.set('data', JSON.parse(JSON.stringify(store.site)) as Site)
      })
    }

    // ── WebSocket provider ─────────────────────────────────────────────────
    _provider = new WebsocketProvider(
      `${wsBase}/collaboration`,
      siteId,
      ydoc,
      { connect: true }
    )

    _provider.on('status', (event: { status: string }) => {
      isConnected.value = event.status === 'connected'
    })

    // ── Awareness: set local state ─────────────────────────────────────────
    _provider.awareness.setLocalStateField('user', localUser.value)

    // ── Awareness: track peers and push PRESENCE_UPDATE to iframe ──────────
    _provider.awareness.on('change', () => {
      const peers: UserPresence[] = []
      _provider.awareness.getStates().forEach((state: Record<string, unknown>, clientId: number) => {
        if (clientId !== _provider.awareness.clientID && state.user) {
          peers.push(state.user as UserPresence)
        }
      })
      connectedUsers.value = peers

      const iframe = previewFrameRef.value
      if (iframe?.contentWindow) {
        sendEditorMessage(
          iframe.contentWindow,
          { type: 'PRESENCE_UPDATE', payload: peers },
          '*'
        )
      }
    })

    // ── Remote Yjs update → Pinia store ───────────────────────────────────
    ysite.observe(() => {
      if (_suppressSync) return
      const remoteData = ysite.get('data')
      if (!remoteData) return
      if (JSON.stringify(remoteData) === JSON.stringify(store.site)) return

      _suppressSync = true
      store.setSite(JSON.parse(JSON.stringify(remoteData)))
      nextTick(() => { _suppressSync = false })
    })

    // ── Local store change → Yjs (debounced 100 ms) ────────────────────────
    _stopSiteWatch = watch(
      () => store.site,
      (newSite) => {
        if (_suppressSync || !newSite) return
        if (_syncTimer) clearTimeout(_syncTimer)
        _syncTimer = setTimeout(() => {
          _syncTimer = null
          if (_suppressSync) return
          _suppressSync = true
          ydoc.transact(() => {
            ysite.set('data', JSON.parse(JSON.stringify(newSite)) as Site)
          })
          _suppressSync = false
        }, 100)
      },
      { deep: true }
    )

    // ── Selection changes → awareness ──────────────────────────────────────
    _stopSelectionWatch = watch(
      [() => store.selectedBlockId, () => store.selectedLayoutBlockId],
      ([blockId, layoutBlockId]) => {
        const updated: UserPresence = {
          ...localUser.value,
          selectedBlockId: blockId,
          selectedLayoutBlockId: layoutBlockId as 'header' | 'footer' | null,
          lastSeen: Date.now()
        }
        localUser.value = updated
        _provider.awareness.setLocalStateField('user', updated)
      }
    )
  })

  // ── Cleanup ───────────────────────────────────────────────────────────────
  onUnmounted(() => {
    _stopSiteWatch?.()
    _stopSelectionWatch?.()
    if (_syncTimer) clearTimeout(_syncTimer)
    _provider?.destroy()
  })

  return {
    isConnected,
    connectedUsers,
    localUser,
    get provider() { return _provider }
  }
}
