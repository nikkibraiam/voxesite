<script setup lang="ts">
import { usePageGenerator } from '../composables/usePageGenerator'

const {
  isModalOpen,
  activeTab,
  closeModal,
  isGenerating,
  generateError,
  streamedTokens,
  urlInput,
  htmlInput,
  screenshotFile,
  generateFromUrl,
  generateFromScreenshot,
  generateFromHtml
} = usePageGenerator()

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  screenshotFile.value = input.files?.[0] ?? null
}

function onDropFile(e: DragEvent) {
  e.preventDefault()
  const file = e.dataTransfer?.files?.[0]
  if (file && /^image\/(png|jpeg|webp)$/.test(file.type)) {
    screenshotFile.value = file
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeModal()
}
</script>

<template>
  <Transition name="modal-fade">
    <div
      v-if="isModalOpen"
      class="gen-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Generar página"
      @keydown="onKeydown"
      @click.self="closeModal"
    >
      <div class="gen-modal">
        <!-- Header -->
        <div class="gen-modal__header">
          <span class="gen-modal__icon" aria-hidden="true">⚡</span>
          <span class="gen-modal__title">Generar Página</span>
          <button
            class="gen-modal__close"
            type="button"
            aria-label="Cerrar"
            @click="closeModal"
          >✕</button>
        </div>

        <!-- Tabs -->
        <div class="gen-modal__tabs" role="tablist">
          <button
            role="tab"
            :aria-selected="activeTab === 'url'"
            :class="{ active: activeTab === 'url' }"
            @click="activeTab = 'url'"
          >URL</button>
          <button
            role="tab"
            :aria-selected="activeTab === 'screenshot'"
            :class="{ active: activeTab === 'screenshot' }"
            @click="activeTab = 'screenshot'"
          >Captura</button>
          <button
            role="tab"
            :aria-selected="activeTab === 'html'"
            :class="{ active: activeTab === 'html' }"
            @click="activeTab = 'html'"
          >HTML</button>
        </div>

        <!-- Body -->
        <div class="gen-modal__body">
          <!-- ── URL tab ──────────────────────────────────────────────────── -->
          <div v-if="activeTab === 'url'" class="gen-modal__tab-panel">
            <label class="gen-modal__label" for="gen-url-input">URL del sitio web</label>
            <input
              id="gen-url-input"
              v-model="urlInput"
              type="url"
              class="gen-modal__input"
              placeholder="https://example.com"
              :disabled="isGenerating"
              @keydown.enter="generateFromUrl"
            />
            <p class="gen-modal__hint">
              Se capturará una vista del sitio y se extraerá su estructura para generar la página.
            </p>
          </div>

          <!-- ── Screenshot tab ───────────────────────────────────────────── -->
          <div v-if="activeTab === 'screenshot'" class="gen-modal__tab-panel">
            <label class="gen-modal__label">Imagen del diseño (PNG, JPG, WEBP)</label>
            <div
              class="gen-modal__dropzone"
              :class="{ 'gen-modal__dropzone--active': screenshotFile }"
              @dragover.prevent
              @drop="onDropFile"
            >
              <span v-if="!screenshotFile" class="gen-modal__dropzone-text">
                Arrastra una imagen aquí o haz clic para seleccionar
              </span>
              <span v-else class="gen-modal__dropzone-text gen-modal__dropzone-text--selected">
                {{ screenshotFile.name }}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                class="gen-modal__file-input"
                :disabled="isGenerating"
                @change="onFileChange"
              />
            </div>
            <p class="gen-modal__hint">
              Requiere un modelo con visión (gpt-4o, claude-opus-4-6, llava, moondream…).
            </p>
          </div>

          <!-- ── HTML tab ─────────────────────────────────────────────────── -->
          <div v-if="activeTab === 'html'" class="gen-modal__tab-panel">
            <label class="gen-modal__label" for="gen-html-input">HTML</label>
            <textarea
              id="gen-html-input"
              v-model="htmlInput"
              class="gen-modal__textarea"
              placeholder="Pega aquí el código HTML que quieres convertir en bloques…"
              rows="8"
              :disabled="isGenerating"
            />
            <p class="gen-modal__hint">
              El HTML será sanitizado antes de enviarse. Funciona con modelos de texto sin visión.
            </p>
          </div>

          <!-- Streamed output -->
          <div
            v-if="streamedTokens"
            class="gen-modal__stream"
            aria-live="polite"
            aria-label="Generando…"
          >
            <pre class="gen-modal__stream-text">{{ streamedTokens }}</pre>
          </div>

          <!-- Error display -->
          <div v-if="generateError" class="gen-modal__error" role="alert">
            {{ generateError }}
          </div>
        </div>

        <!-- Footer -->
        <div class="gen-modal__footer">
          <button
            class="gen-modal__btn gen-modal__btn--secondary"
            type="button"
            :disabled="isGenerating"
            @click="closeModal"
          >Cancelar</button>

          <button
            v-if="activeTab === 'url'"
            class="gen-modal__btn gen-modal__btn--primary"
            type="button"
            :disabled="isGenerating || !urlInput.trim()"
            @click="generateFromUrl"
          >
            <span v-if="isGenerating" class="gen-modal__spinner" aria-hidden="true" />
            <span>{{ isGenerating ? 'Generando…' : '⚡ Generar' }}</span>
          </button>

          <button
            v-else-if="activeTab === 'screenshot'"
            class="gen-modal__btn gen-modal__btn--primary"
            type="button"
            :disabled="isGenerating || !screenshotFile"
            @click="generateFromScreenshot"
          >
            <span v-if="isGenerating" class="gen-modal__spinner" aria-hidden="true" />
            <span>{{ isGenerating ? 'Generando…' : '⚡ Generar' }}</span>
          </button>

          <button
            v-else-if="activeTab === 'html'"
            class="gen-modal__btn gen-modal__btn--primary"
            type="button"
            :disabled="isGenerating || !htmlInput.trim()"
            @click="generateFromHtml"
          >
            <span v-if="isGenerating" class="gen-modal__spinner" aria-hidden="true" />
            <span>{{ isGenerating ? 'Generando…' : '⚡ Generar' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* ── Overlay ────────────────────────────────────────────────────────────────── */
.gen-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

/* ── Modal ──────────────────────────────────────────────────────────────────── */
.gen-modal {
  background: #1a1a2e;
  color: #e8e8f0;
  border: 1px solid #2e2e50;
  border-radius: 10px;
  width: 100%;
  max-width: 540px;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
}

/* ── Header ─────────────────────────────────────────────────────────────────── */
.gen-modal__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #2e2e50;
  flex-shrink: 0;
}

.gen-modal__icon {
  font-size: 18px;
}

.gen-modal__title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #9090d0;
}

/* 44×44 px touch target */
.gen-modal__close {
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

.gen-modal__close:hover {
  background: #2e2e50;
  color: #fff;
}

/* ── Tabs ───────────────────────────────────────────────────────────────────── */
.gen-modal__tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #2e2e50;
  flex-shrink: 0;
}

.gen-modal__tabs button {
  flex: 1;
  height: 44px;
  border: none;
  background: transparent;
  color: #9090d0;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
}

.gen-modal__tabs button:hover {
  color: #c0c0e8;
}

.gen-modal__tabs button.active {
  color: #fff;
  border-bottom-color: #5858c8;
}

/* ── Body ───────────────────────────────────────────────────────────────────── */
.gen-modal__body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

.gen-modal__tab-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gen-modal__label {
  font-size: 12px;
  font-weight: 600;
  color: #9090d0;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.gen-modal__input,
.gen-modal__textarea {
  width: 100%;
  box-sizing: border-box;
  background: #111128;
  border: 1px solid #2e2e50;
  border-radius: 4px;
  color: #e8e8f0;
  font-size: 13px;
  padding: 10px;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s;
}

.gen-modal__input:focus,
.gen-modal__textarea:focus {
  border-color: #5858c8;
}

.gen-modal__input:disabled,
.gen-modal__textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.gen-modal__textarea {
  resize: vertical;
  line-height: 1.5;
  min-height: 120px;
}

.gen-modal__hint {
  font-size: 11px;
  color: #6060a0;
  margin: 0;
  line-height: 1.4;
}

/* ── Dropzone ───────────────────────────────────────────────────────────────── */
.gen-modal__dropzone {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  border: 2px dashed #2e2e50;
  border-radius: 6px;
  background: #111128;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  overflow: hidden;
}

.gen-modal__dropzone:hover,
.gen-modal__dropzone--active {
  border-color: #5858c8;
  background: #1a1a3e;
}

.gen-modal__dropzone-text {
  font-size: 13px;
  color: #6060a0;
  text-align: center;
  padding: 0 16px;
  pointer-events: none;
}

.gen-modal__dropzone-text--selected {
  color: #a0d0a0;
}

.gen-modal__file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
}

/* ── Stream output ──────────────────────────────────────────────────────────── */
.gen-modal__stream {
  background: #111128;
  border: 1px solid #2e2e50;
  border-radius: 4px;
  padding: 8px;
  max-height: 140px;
  overflow-y: auto;
}

.gen-modal__stream-text {
  margin: 0;
  font-size: 11px;
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  color: #b0b0e8;
  white-space: pre-wrap;
  word-break: break-all;
}

/* ── Error ──────────────────────────────────────────────────────────────────── */
.gen-modal__error {
  background: #2e1515;
  border: 1px solid #6e2020;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 12px;
  color: #f08080;
}

/* ── Footer ─────────────────────────────────────────────────────────────────── */
.gen-modal__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #2e2e50;
  flex-shrink: 0;
}

/* 44px min-height buttons */
.gen-modal__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 44px;
  padding: 0 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background 0.15s, opacity 0.15s;
}

.gen-modal__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.gen-modal__btn--secondary {
  background: #2e2e50;
  color: #b0b0e8;
}

.gen-modal__btn--secondary:not(:disabled):hover {
  background: #3a3a70;
}

.gen-modal__btn--primary {
  background: #5858c8;
  color: #fff;
}

.gen-modal__btn--primary:not(:disabled):hover {
  background: #6868e0;
}

/* Loading spinner */
.gen-modal__spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: gen-spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes gen-spin {
  to { transform: rotate(360deg); }
}

/* ── Modal fade transition ──────────────────────────────────────────────────── */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
