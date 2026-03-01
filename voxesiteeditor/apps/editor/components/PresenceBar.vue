<script setup lang="ts">
import type { UserPresence } from '@cms/contracts'

const props = defineProps<{
  users: UserPresence[]
  localUser: UserPresence | null
  isConnected: boolean
}>()

const MAX_VISIBLE = 5

const visibleUsers = computed(() => props.users.slice(0, MAX_VISIBLE))
const overflowCount = computed(() => Math.max(0, props.users.length - MAX_VISIBLE))

function initials(name: string): string {
  return name
    .split(/[\s-_]+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

function editingLabel(user: UserPresence): string {
  if (user.selectedBlockId) return `editando bloque`
  if (user.selectedLayoutBlockId) return `editando ${user.selectedLayoutBlockId}`
  return 'en línea'
}
</script>

<template>
  <div class="presence-bar" :class="{ 'is-connected': isConnected }">
    <!-- Connection dot -->
    <span class="presence-dot" :title="isConnected ? 'Conectado' : 'Desconectado'" />

    <!-- Remote user avatars -->
    <div class="presence-avatars">
      <div
        v-for="user in visibleUsers"
        :key="user.userId"
        class="presence-avatar"
        :style="{ '--avatar-color': user.color }"
        :title="`${user.displayName} — ${editingLabel(user)}`"
        role="img"
        :aria-label="user.displayName"
      >
        {{ initials(user.displayName) }}
        <!-- Subtle block-selection ring when editing -->
        <span
          v-if="user.selectedBlockId || user.selectedLayoutBlockId"
          class="presence-avatar__ring"
        />
      </div>

      <!-- Overflow pill (+N) -->
      <div
        v-if="overflowCount > 0"
        class="presence-avatar presence-avatar--overflow"
        :title="`+${overflowCount} más`"
      >
        +{{ overflowCount }}
      </div>
    </div>

    <!-- Local user chip (you) -->
    <div
      v-if="localUser"
      class="presence-avatar presence-avatar--local"
      :style="{ '--avatar-color': localUser.color }"
      title="Tú"
    >
      {{ initials(localUser.displayName) }}
    </div>
  </div>
</template>

<style scoped>
.presence-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 6px;
  flex-shrink: 0;
}

/* Connection dot */
.presence-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #aaa;
  flex-shrink: 0;
  transition: background 0.3s;
}

.presence-bar.is-connected .presence-dot {
  background: #22c55e;
}

/* Avatar list */
.presence-avatars {
  display: flex;
  gap: 2px;
}

/* Individual avatar circle */
.presence-avatar {
  position: relative;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--avatar-color, #666);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  user-select: none;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: transform 0.15s;
  /* 44×44 px touch target via padding-box expansion */
  min-width: 28px;
}

.presence-avatar:hover {
  transform: scale(1.15);
  z-index: 10;
}

/* "You" chip — slightly different styling */
.presence-avatar--local {
  opacity: 0.7;
  border-style: dashed;
}

/* Overflow pill */
.presence-avatar--overflow {
  background: #555;
  font-size: 10px;
}

/* Ring shown when user is actively editing a block */
.presence-avatar__ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid var(--avatar-color, #666);
  animation: ring-pulse 1.5s ease-in-out infinite;
  pointer-events: none;
}

@keyframes ring-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50%       { opacity: 1;   transform: scale(1.15); }
}
</style>
