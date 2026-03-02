<script setup lang="ts">
import { ref } from 'vue'
import type { AlertProps } from '@cms/contracts'

const props = withDefaults(defineProps<AlertProps>(), {
  type: 'info',
  message: '',
  dismissible: false,
})

const isDismissed = ref(false)

const icons: Record<string, string> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
}
</script>

<template>
  <div
    v-if="!isDismissed"
    class="alert"
    :class="`alert--${type ?? 'info'}`"
    role="alert"
  >
    <span class="alert__icon" aria-hidden="true">{{ icons[type ?? 'info'] }}</span>
    <div class="alert__content">
      <strong v-if="title" class="alert__title">{{ title }}</strong>
      <p v-if="message" class="alert__message">{{ message }}</p>
    </div>
    <button
      v-if="dismissible"
      class="alert__close"
      type="button"
      aria-label="Cerrar alerta"
      @click="isDismissed = true"
    >×</button>
  </div>
</template>

<style scoped>
.alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 6px;
  border-left: 4px solid transparent;
  margin: 1rem 1.5rem;
}

.alert--info    { background: #ebf8ff; border-color: #3182ce; color: #1a365d; }
.alert--success { background: #f0fff4; border-color: #38a169; color: #1c4532; }
.alert--warning { background: #fffbeb; border-color: #d69e2e; color: #744210; }
.alert--error   { background: #fff5f5; border-color: #e53e3e; color: #63171b; }

.alert__icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.0625rem;
}

.alert__content {
  flex: 1;
  min-width: 0;
}

.alert__title {
  display: block;
  font-size: 0.9375rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.alert__message {
  font-size: 0.9375rem;
  margin: 0;
  line-height: 1.5;
}

.alert__close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
  padding: 0.25rem;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  flex-shrink: 0;
  transition: opacity 0.15s;
}

.alert__close:hover {
  opacity: 1;
}
</style>
