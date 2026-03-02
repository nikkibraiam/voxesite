<script setup lang="ts">
import { ref } from 'vue'
import type { SearchBarProps } from '@cms/contracts'

const props = withDefaults(defineProps<SearchBarProps>(), {
  placeholder: 'Buscar...',
  searchUrl: '/buscar?q={query}',
  buttonLabel: 'Buscar',
})

const query = ref('')

function handleSearch() {
  if (!query.value.trim()) return
  const url = (props.searchUrl ?? '/buscar?q={query}')
    .replace('{query}', encodeURIComponent(query.value.trim()))
  if (typeof window !== 'undefined') {
    window.location.href = url
  }
}
</script>

<template>
  <div class="search-bar">
    <form class="search-bar__form" role="search" @submit.prevent="handleSearch">
      <label class="search-bar__label" for="search-input">Buscar</label>
      <div class="search-bar__row">
        <input
          id="search-input"
          v-model="query"
          class="search-bar__input"
          type="search"
          :placeholder="placeholder"
          autocomplete="off"
        />
        <button
          class="search-bar__btn"
          type="submit"
        >{{ buttonLabel }}</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.search-bar {
  padding: 1.5rem;
  max-width: 640px;
  margin: 0 auto;
}

.search-bar__label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
}

.search-bar__form {
  position: relative;
}

.search-bar__row {
  display: flex;
  gap: 0.5rem;
}

.search-bar__input {
  flex: 1;
  padding: 0.625rem 1rem;
  min-height: 44px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  font-size: 1rem;
  background: #fff;
  transition: border-color 0.15s;
}

.search-bar__input:focus {
  outline: none;
  border-color: #5858c8;
  box-shadow: 0 0 0 3px rgba(88, 88, 200, 0.15);
}

.search-bar__btn {
  padding: 0.625rem 1.25rem;
  min-height: 44px;
  background: #5858c8;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}

.search-bar__btn:hover {
  background: #4646aa;
}

@media (max-width: 480px) {
  .search-bar__row { flex-direction: column; }
}
</style>
