<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Page } from '@cms/contracts'
import { renderBlock } from '@cms/ui'

// 1️⃣ estado de la página
const page = ref<Page | null>(null)

// 2️⃣ carga normal (runtime standalone)
const { data } = await useFetch<Page>('/api/page/home')
page.value = data.value || null

// 3️⃣ escucha preview desde el editor
onMounted(() => {
  window.addEventListener('message', (event) => {
    console.log("entro evento")
    console.log(event.data)
    if (event.origin !== 'http://localhost:3000') return
    page.value = event.data as Page
  })
})
</script>

<template>
  <component
    v-for="block in page?.blocks || []"
    :is="renderBlock(block)"
    v-bind="block.props"
    :key="block.id"
  />
</template>
