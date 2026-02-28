<script setup lang="ts">
import { usePageStore } from '../stores/usePageStore'
import { useAiEditor } from '../composables/useAiEditor'
import { useVoiceInput } from '../composables/useVoiceInput'

const store = usePageStore()
const {
  isAiPanelOpen,
  aiPrompt,
  isLoading,
  aiError,
  streamedTokens,
  toggleAiPanel,
  submitPrompt,
  clearPrompt
} = useAiEditor()

const { isListening, liveTranscript, startListening, stopListening } = useVoiceInput({
  aiPrompt
})

function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    submitPrompt()
  }
}

function toggleMic() {
  if (isListening.value) {
    stopListening()
  } else {
    startListening()
  }
}
</script>

<template>
  <Transition name="ai-panel">
    <section
      v-if="isAiPanelOpen"
      class="ai-panel"
      aria-label="Panel de IA"
    >
      <!-- Header -->
      <div class="ai-panel__header">
        <div class="ai-panel__title">
          <span class="ai-panel__icon">✨</span>
          <span>IA — {{ store.currentPage?.title ?? store.currentPage?.slug ?? 'Sin página' }}</span>
        </div>
        <button
          class="ai-panel__close"
          type="button"
          aria-label="Cerrar panel de IA"
          @click="toggleAiPanel"
        >✕</button>
      </div>

      <!-- Body: streamed output + error -->
      <div class="ai-panel__body">
        <div
          v-if="streamedTokens"
          class="ai-panel__stream"
          aria-live="polite"
          aria-label="Respuesta de la IA"
        >
          <pre class="ai-panel__stream-text">{{ streamedTokens }}</pre>
        </div>

        <div
          v-if="aiError"
          class="ai-panel__error"
          role="alert"
        >
          {{ aiError }}
        </div>

        <!-- Prompt textarea
             While listening: liveTranscript is shown as ghost placeholder text.
             When TRANSCRIPT_DONE arrives: aiPrompt is populated and ready to submit. -->
        <textarea
          v-model="aiPrompt"
          class="ai-panel__textarea"
          :class="{ 'ai-panel__textarea--listening': isListening }"
          :placeholder="isListening
            ? (liveTranscript || 'Escuchando…')
            : 'Describe los cambios que quieres hacer en la página… (Ctrl+Enter para enviar)'"
          rows="3"
          :disabled="isLoading"
          @keydown="onKeydown"
        />
      </div>

      <!-- Footer: actions -->
      <div class="ai-panel__footer">
        <button
          class="ai-panel__btn ai-panel__btn--secondary"
          type="button"
          :disabled="isLoading"
          @click="clearPrompt"
        >Limpiar</button>

        <!-- Mic button — 44×44 px touch target -->
        <button
          class="ai-panel__mic"
          type="button"
          :class="{ 'ai-panel__mic--listening': isListening }"
          :aria-label="isListening ? 'Detener grabación de voz' : 'Iniciar entrada de voz'"
          :disabled="isLoading"
          @click="toggleMic"
        >
          <span class="ai-panel__mic-icon" aria-hidden="true">🎤</span>
          <span v-if="isListening" class="ai-panel__mic-pulse" aria-hidden="true" />
        </button>

        <button
          class="ai-panel__btn ai-panel__btn--primary"
          type="button"
          :disabled="isLoading || !aiPrompt.trim() || !store.currentPage"
          @click="submitPrompt"
        >
          <span v-if="isLoading" class="ai-panel__spinner" aria-hidden="true" />
          <span>{{ isLoading ? 'Procesando…' : 'Enviar' }}</span>
        </button>
      </div>
    </section>
  </Transition>
</template>

<style scoped>
/* ── Panel container ────────────────────────────────────────────────────────── */
.ai-panel {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
  color: #e8e8f0;
  border-top: 1px solid #2e2e50;
  max-height: 320px;
  overflow: hidden;
}

/* ── Header ─────────────────────────────────────────────────────────────────── */
.ai-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #2e2e50;
  flex-shrink: 0;
}

.ai-panel__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #9090d0;
}

.ai-panel__icon {
  font-size: 14px;
}

/* 44×44 px touch target */
.ai-panel__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  color: #9090d0;
  font-size: 14px;
  cursor: pointer;
  border-radius: 6px;
  margin-right: -8px;
  transition: background 0.15s, color 0.15s;
}

.ai-panel__close:hover {
  background: #2e2e50;
  color: #fff;
}

/* ── Body ───────────────────────────────────────────────────────────────────── */
.ai-panel__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 12px;
  overflow-y: auto;
  min-height: 0;
}

/* Streaming token output */
.ai-panel__stream {
  background: #111128;
  border: 1px solid #2e2e50;
  border-radius: 4px;
  padding: 6px 8px;
  max-height: 100px;
  overflow-y: auto;
}

.ai-panel__stream-text {
  margin: 0;
  font-size: 11px;
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  color: #b0b0e8;
  white-space: pre-wrap;
  word-break: break-all;
}

/* Error message */
.ai-panel__error {
  background: #2e1515;
  border: 1px solid #6e2020;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 12px;
  color: #f08080;
}

/* Prompt textarea */
.ai-panel__textarea {
  width: 100%;
  box-sizing: border-box;
  background: #111128;
  border: 1px solid #2e2e50;
  border-radius: 4px;
  color: #e8e8f0;
  font-size: 13px;
  line-height: 1.5;
  padding: 8px;
  resize: none;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s;
  min-height: 66px;
}

.ai-panel__textarea:focus {
  border-color: #5858c8;
}

.ai-panel__textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── Footer ─────────────────────────────────────────────────────────────────── */
.ai-panel__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid #2e2e50;
  flex-shrink: 0;
}

/* Buttons — minimum 44px height for touch targets */
.ai-panel__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 44px;
  padding: 0 18px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background 0.15s, opacity 0.15s;
}

.ai-panel__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ai-panel__btn--secondary {
  background: #2e2e50;
  color: #b0b0e8;
}

.ai-panel__btn--secondary:not(:disabled):hover {
  background: #3a3a70;
}

.ai-panel__btn--primary {
  background: #5858c8;
  color: #fff;
}

.ai-panel__btn--primary:not(:disabled):hover {
  background: #6868e0;
}

/* Loading spinner */
.ai-panel__spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ai-spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes ai-spin {
  to { transform: rotate(360deg); }
}

/* Textarea listening state — pulsing border to indicate active recording */
.ai-panel__textarea--listening {
  border-color: #c84040;
  animation: ai-border-pulse 1.2s ease-in-out infinite;
}

@keyframes ai-border-pulse {
  0%, 100% { border-color: #c84040; }
  50%       { border-color: #ff6060; }
}

/* ── Mic button ─────────────────────────────────────────────────────────────── */
.ai-panel__mic {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: #2e2e50;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
}

.ai-panel__mic:not(:disabled):hover {
  background: #3a3a70;
}

.ai-panel__mic:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ai-panel__mic--listening {
  background: #4a1010;
}

.ai-panel__mic--listening:not(:disabled):hover {
  background: #6e1a1a;
}

.ai-panel__mic-icon {
  font-size: 18px;
  line-height: 1;
}

/* Pulsing red ring visible while recording */
.ai-panel__mic-pulse {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid #ff4040;
  animation: mic-pulse 1s ease-out infinite;
  pointer-events: none;
}

@keyframes mic-pulse {
  0%   { transform: scale(1);    opacity: 0.9; }
  100% { transform: scale(1.6);  opacity: 0; }
}

/* ── Slide-up transition ────────────────────────────────────────────────────── */
.ai-panel-enter-active,
.ai-panel-leave-active {
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.3s ease;
}

.ai-panel-enter-from,
.ai-panel-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
