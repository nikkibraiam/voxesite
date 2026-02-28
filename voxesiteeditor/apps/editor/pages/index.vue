<script setup lang="ts">
import { BlockSchemas } from '@cms/ui/schemas'
import BlockEditorModal from '../modals/BlockEditorModal.vue'
import { usePageStore } from '../stores/usePageStore'
import { usePageEditor } from '../composables/usePageEditor'
import { useDragDrop } from '../composables/useDragDrop'

const store = usePageStore()
const { savePage, publishSite } = usePageEditor()
useDragDrop()
</script>

<template>
  <button
    v-for="[type, schema] in Object.entries(BlockSchemas)"
    :key="type"
    @click="store.addBlock(type)"
  >{{ schema.content.label }}</button>

  <button :disabled="!store.canUndo" @click="store.undo()">Deshacer</button>
  <button :disabled="!store.canRedo" @click="store.redo()">Rehacer</button>

  <iframe ref="previewFrame" src="http://localhost:3001" width="100%" height="400" />

  <button @click="savePage">Guardar página</button>
  <button @click="publishSite('demosite')">Publicar</button>

  <!-- Modal reads selectedBlock from the store directly — no props needed -->
  <BlockEditorModal />
</template>
