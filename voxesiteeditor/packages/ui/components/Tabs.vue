<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TabsProps, TabItem } from '@cms/contracts'

const props = withDefaults(defineProps<TabsProps>(), {
  defaultTab: 0,
})

const parsedTabs = computed<TabItem[]>(() => {
  if (!props.tabs) return []
  if (Array.isArray(props.tabs)) return props.tabs
  try { return JSON.parse(props.tabs as string) } catch { return [] }
})

const activeTab = ref<number>(Number(props.defaultTab) || 0)
</script>

<template>
  <div class="tabs">
    <div
      class="tabs__list"
      role="tablist"
    >
      <button
        v-for="(tab, i) in parsedTabs"
        :key="i"
        class="tabs__tab"
        :class="{ 'tabs__tab--active': activeTab === i }"
        role="tab"
        type="button"
        :aria-selected="activeTab === i"
        @click="activeTab = i"
      >{{ tab.label }}</button>
    </div>

    <div class="tabs__panels">
      <div
        v-for="(tab, i) in parsedTabs"
        :key="i"
        role="tabpanel"
        :hidden="activeTab !== i"
        class="tabs__panel"
        :class="{ 'tabs__panel--active': activeTab === i }"
      >
        <p class="tabs__content">{{ tab.content }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tabs {
  padding: 1.5rem;
  max-width: 900px;
  margin: 0 auto;
}

.tabs__list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  border-bottom: 2px solid rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.tabs__tab {
  padding: 0.625rem 1.25rem;
  min-height: 44px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  font-size: 0.9375rem;
  font-weight: 500;
  color: inherit;
  opacity: 0.6;
  transition: opacity 0.15s, border-color 0.15s;
  border-radius: 4px 4px 0 0;
}

.tabs__tab:hover {
  opacity: 0.85;
  background: rgba(0, 0, 0, 0.03);
}

.tabs__tab--active {
  opacity: 1;
  border-bottom-color: #5858c8;
  color: #5858c8;
}

.tabs__panel {
  display: none;
}

.tabs__panel--active {
  display: block;
}

.tabs__content {
  font-size: 0.9375rem;
  line-height: 1.7;
  margin: 0;
  opacity: 0.8;
  white-space: pre-wrap;
}

@media (max-width: 480px) {
  .tabs__list {
    overflow-x: auto;
    flex-wrap: nowrap;
  }

  .tabs__tab {
    white-space: nowrap;
  }
}
</style>
