<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CodeBlockProps } from '@cms/contracts'

const props = withDefaults(defineProps<CodeBlockProps>(), {
  code: '',
  language: '',
  showCopyButton: true,
  showLineNumbers: false,
})

const copied = ref(false)

const lines = computed(() => (props.code ?? '').split('\n'))

async function copyCode() {
  if (!navigator?.clipboard) return
  await navigator.clipboard.writeText(props.code ?? '')
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <div class="code-block">
    <div class="code-block__header">
      <span v-if="language" class="code-block__lang">{{ language }}</span>
      <button
        v-if="showCopyButton"
        class="code-block__copy"
        type="button"
        :aria-label="copied ? 'Copiado' : 'Copiar código'"
        @click="copyCode"
      >
        {{ copied ? '✓ Copiado' : '⎘ Copiar' }}
      </button>
    </div>
    <pre class="code-block__pre"><code class="code-block__code"><template v-if="showLineNumbers"><span
        v-for="(line, i) in lines"
        :key="i"
        class="code-block__line"
      ><span class="code-block__line-num">{{ i + 1 }}</span>{{ line + (i < lines.length - 1 ? '\n' : '') }}</span></template><template v-else>{{ code }}</template></code></pre>
  </div>
</template>

<style scoped>
.code-block {
  margin: 1rem 1.5rem;
  border-radius: 8px;
  overflow: hidden;
  background: #1a1a2e;
  color: #e2e8f0;
}

.code-block__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  min-height: 36px;
}

.code-block__lang {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.5;
  font-family: monospace;
}

.code-block__copy {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: inherit;
  cursor: pointer;
  font-size: 0.8125rem;
  padding: 0.25rem 0.625rem;
  min-height: 44px;
  border-radius: 4px;
  opacity: 0.7;
  transition: opacity 0.15s;
}

.code-block__copy:hover {
  opacity: 1;
}

.code-block__pre {
  margin: 0;
  padding: 1.25rem 1rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.code-block__code {
  font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 0.875rem;
  line-height: 1.7;
  white-space: pre;
}

.code-block__line {
  display: block;
}

.code-block__line-num {
  display: inline-block;
  width: 3ch;
  margin-right: 1.5rem;
  opacity: 0.35;
  user-select: none;
  text-align: right;
}
</style>
