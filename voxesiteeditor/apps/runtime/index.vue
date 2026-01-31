<script setup lang="ts">
import { renderBlock } from '@cms/ui/renderer/renderComponent'
import type { Page } from '@cms/contracts'

const { data: page } = await useFetch<Page>('/api/page/home')
</script>

<template>
  <component
    v-for="block in page?.blocks || []"
    :is="renderBlock(block)"
    v-bind="block.props"
    :key="block.id"
  />
</template>
