<script setup lang="ts">
import { ref, watch, computed } from 'vue'

export interface SubfieldDef {
  key: string
  label: string
  type: 'string' | 'boolean' | 'number' | 'color'
}

const props = defineProps<{
  /** Field label shown above the list */
  label: string
  /**
   * Current value — accepts an Array OR a JSON string (backwards compat with
   * blocks that stored their array props as stringified JSON).
   */
  value: any[] | string | null | undefined
  /**
   * If provided, each item is an object rendered as a mini sub-form.
   * If omitted, items are treated as plain strings (tag-list style).
   */
  subfields?: SubfieldDef[]
}>()

const emit = defineEmits<{
  'update:value': [value: any[]]
}>()

// ── Normalise incoming value (handle JSON string → array) ────────────────────

function parse(v: any): any[] {
  if (Array.isArray(v)) return v
  if (typeof v === 'string') {
    try { return JSON.parse(v) } catch { return [] }
  }
  return []
}

const items = ref<any[]>(parse(props.value))

watch(
  () => props.value,
  (v) => { items.value = parse(v) },
  { deep: true }
)

// ── Track which object-items are expanded ────────────────────────────────────

const expanded = ref<Set<number>>(new Set(items.value.length > 0 ? [0] : []))

function toggleExpand(i: number) {
  if (expanded.value.has(i)) expanded.value.delete(i)
  else expanded.value.add(i)
  // Force reactivity on the Set
  expanded.value = new Set(expanded.value)
}

// ── Summary label for a collapsed item (first non-empty string field) ────────

function itemLabel(item: any, i: number): string {
  if (!props.subfields) return String(item ?? '')
  for (const f of props.subfields) {
    const v = item?.[f.key]
    if (v && typeof v === 'string') return v
  }
  return `Ítem ${i + 1}`
}

// ── Mutation helpers ─────────────────────────────────────────────────────────

function flush() {
  emit('update:value', items.value.slice())
}

function addItem() {
  if (props.subfields) {
    const obj: Record<string, any> = {}
    for (const f of props.subfields) {
      obj[f.key] = f.type === 'boolean' ? false : f.type === 'number' ? 0 : ''
    }
    items.value = [...items.value, obj]
    // Expand the new item
    expanded.value = new Set([...expanded.value, items.value.length - 1])
  } else {
    items.value = [...items.value, '']
  }
  flush()
}

function removeItem(i: number) {
  items.value = items.value.filter((_, idx) => idx !== i)
  // Rebuild expanded set — indices above i shift down
  const next = new Set<number>()
  for (const idx of expanded.value) {
    if (idx < i) next.add(idx)
    else if (idx > i) next.add(idx - 1)
  }
  expanded.value = next
  flush()
}

function updateItem(i: number, value: any) {
  const copy = [...items.value]
  copy[i] = value
  items.value = copy
  flush()
}

function updateField(i: number, key: string, value: any) {
  const copy = [...items.value]
  copy[i] = { ...copy[i], [key]: value }
  items.value = copy
  flush()
}

function moveUp(i: number) {
  if (i === 0) return
  const copy = [...items.value]
  ;[copy[i - 1], copy[i]] = [copy[i], copy[i - 1]]
  items.value = copy
  flush()
}

function moveDown(i: number) {
  if (i === items.value.length - 1) return
  const copy = [...items.value]
  ;[copy[i], copy[i + 1]] = [copy[i + 1], copy[i]]
  items.value = copy
  flush()
}
</script>

<template>
  <div class="af">
    <div class="af__label">{{ label }}</div>

    <!-- ── String array (tag-list style) ──────────────────────────────────── -->
    <template v-if="!subfields">
      <div v-for="(item, i) in items" :key="i" class="af__row">
        <input
          type="text"
          class="af__input"
          :value="String(item ?? '')"
          @input="updateItem(i, ($event.target as HTMLInputElement).value)"
        />
        <button class="af__icon-btn" title="Eliminar" @click="removeItem(i)">✕</button>
      </div>
    </template>

    <!-- ── Array of objects (collapsible sub-forms) ────────────────────────── -->
    <template v-else>
      <div v-for="(item, i) in items" :key="i" class="af__item">
        <div class="af__item-head">
          <button class="af__expand-btn" @click="toggleExpand(i)">
            <span class="af__expand-icon">{{ expanded.has(i) ? '▾' : '▸' }}</span>
            <span class="af__item-summary">{{ itemLabel(item, i) }}</span>
          </button>
          <div class="af__item-actions">
            <button class="af__icon-btn" title="Subir" :disabled="i === 0" @click="moveUp(i)">↑</button>
            <button class="af__icon-btn" title="Bajar" :disabled="i === items.length - 1" @click="moveDown(i)">↓</button>
            <button class="af__icon-btn af__icon-btn--danger" title="Eliminar" @click="removeItem(i)">✕</button>
          </div>
        </div>

        <div v-if="expanded.has(i)" class="af__item-body">
          <div v-for="f in subfields" :key="f.key" class="af__subfield">
            <label class="af__sublabel">{{ f.label }}</label>

            <input
              v-if="f.type === 'string'"
              type="text"
              class="af__input"
              :value="item[f.key] ?? ''"
              @input="updateField(i, f.key, ($event.target as HTMLInputElement).value)"
            />

            <input
              v-else-if="f.type === 'number'"
              type="number"
              class="af__input af__input--narrow"
              :value="item[f.key] ?? 0"
              @input="updateField(i, f.key, Number(($event.target as HTMLInputElement).value))"
            />

            <label v-else-if="f.type === 'boolean'" class="af__checkbox-wrap">
              <input
                type="checkbox"
                :checked="item[f.key] ?? false"
                @change="updateField(i, f.key, ($event.target as HTMLInputElement).checked)"
              />
              <span class="af__checkbox-label">{{ f.label }}</span>
            </label>

            <input
              v-else-if="f.type === 'color'"
              type="color"
              class="af__color"
              :value="item[f.key] || '#ffffff'"
              @input="updateField(i, f.key, ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>
      </div>
    </template>

    <button class="af__add-btn" @click="addItem">+ Agregar</button>
  </div>
</template>

<style scoped>
/* ── Container ──────────────────────────────────────────────────────────────── */
.af {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ── Label ──────────────────────────────────────────────────────────────────── */
.af__label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888;
}

/* ── String row ──────────────────────────────────────────────────────────────── */
.af__row {
  display: flex;
  gap: 4px;
  align-items: center;
}

/* ── Inputs ─────────────────────────────────────────────────────────────────── */
.af__input {
  flex: 1;
  background: #111;
  border: 1px solid #333;
  border-radius: 4px;
  color: #e8e8e8;
  font-size: 12px;
  padding: 5px 8px;
  outline: none;
  font-family: inherit;
  min-height: 30px;
  box-sizing: border-box;
}

.af__input:focus {
  border-color: #555;
}

.af__input--narrow {
  max-width: 80px;
  flex: none;
}

.af__color {
  width: 36px;
  height: 30px;
  padding: 2px;
  border: 1px solid #333;
  border-radius: 4px;
  background: #111;
  cursor: pointer;
}

/* ── Icon buttons (remove, move) ─────────────────────────────────────────────── */
.af__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid #444;
  border-radius: 4px;
  background: transparent;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.1s, color 0.1s;
}

.af__icon-btn:hover:not(:disabled) {
  background: #2a2a2a;
  color: #ddd;
}

.af__icon-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.af__icon-btn--danger:hover:not(:disabled) {
  background: #6e2020;
  color: #f08080;
  border-color: #6e2020;
}

/* ── Object item card ────────────────────────────────────────────────────────── */
.af__item {
  border: 1px solid #2a2a2a;
  border-radius: 4px;
  overflow: hidden;
}

.af__item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px 0 0;
  background: #1a1a1a;
}

.af__expand-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  padding: 7px 8px;
  background: transparent;
  border: none;
  color: #ddd;
  font-size: 12px;
  cursor: pointer;
  text-align: left;
  min-height: 36px;
}

.af__expand-icon {
  color: #666;
  font-size: 10px;
  flex-shrink: 0;
}

.af__item-summary {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.af__item-actions {
  display: flex;
  gap: 2px;
}

/* ── Sub-form body ───────────────────────────────────────────────────────────── */
.af__item-body {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #111;
  border-top: 1px solid #2a2a2a;
}

.af__subfield {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.af__sublabel {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #666;
}

.af__checkbox-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.af__checkbox-label {
  font-size: 12px;
  color: #bbb;
}

/* ── Add button ──────────────────────────────────────────────────────────────── */
.af__add-btn {
  align-self: flex-start;
  padding: 5px 12px;
  border: 1px dashed #444;
  border-radius: 4px;
  background: transparent;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
  min-height: 30px;
}

.af__add-btn:hover {
  border-color: #5858c8;
  color: #a0a0f8;
}
</style>
