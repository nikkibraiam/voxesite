<script setup lang="ts">
const props = defineProps<{
  blockId: string
  enabled?: boolean
  /** When set, renders a coloured left-border to indicate a remote peer's selection. */
  peer?: { color: string; displayName: string } | null
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
}>()

function onClick() {
  if (!props.enabled) return
  emit('select', props.blockId)
}
</script>


<template>
  <div
    class="selectable-block"
    :class="{ 'selectable-block--peer': !!peer }"
    :style="peer ? { '--peer-color': peer.color } : {}"
    :title="peer ? `${peer.displayName} está editando este bloque` : undefined"
    @click.stop="onClick"
  >
    <!--
      Drag handle — always visible on touch devices, visible on hover on desktop.
      @pointerdown.stop prevents the click-to-select logic from firing when the
      user grabs the handle. touch-action:none (set in CSS) is required so the
      WebView does not intercept the touch event for page scrolling.
    -->
    <div class="drag-handle" aria-hidden="true">
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
      >
        <!-- 6-dot grip (2 columns × 3 rows) -->
        <circle cx="5" cy="3.5" r="1.5" />
        <circle cx="11" cy="3.5" r="1.5" />
        <circle cx="5" cy="8" r="1.5" />
        <circle cx="11" cy="8" r="1.5" />
        <circle cx="5" cy="12.5" r="1.5" />
        <circle cx="11" cy="12.5" r="1.5" />
      </svg>
    </div>

    <slot />
  </div>
</template>

<style scoped>
.selectable-block {
  position: relative;
}

.selectable-block:hover {
  outline: 2px solid rgba(59, 130, 246, 0.8);
  cursor: pointer;
}

/* ── Peer highlight — coloured left border when a remote user has this block ── */

.selectable-block--peer {
  border-left: 3px solid var(--peer-color, #888);
  transition: border-color 0.2s ease;
}

.selectable-block--peer:not(:hover) {
  outline: none;
}

/* ── Drag handle ─────────────────────────────────────────────────────────── */

.drag-handle {
  position: absolute;
  top: 50%;
  left: 4px;
  transform: translateY(-50%);

  /* Minimum 44×44 px touch target (WCAG 2.5.5 / WebView requirement). */
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;

  cursor: grab;
  touch-action: none; /* critical — prevents WebView from stealing touch for scroll */
  color: #888;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.85);
  z-index: 10;

  /* Desktop: fade in on parent hover */
  opacity: 0;
  transition: opacity 0.15s ease;
}

.selectable-block:hover .drag-handle {
  opacity: 1;
}

/* Touch / mobile: always visible (pointer: coarse = touchscreen) */
@media (hover: none), (pointer: coarse) {
  .drag-handle {
    opacity: 1;
  }
}

.drag-handle:active {
  cursor: grabbing;
  background: rgba(255, 255, 255, 1);
}
</style>
