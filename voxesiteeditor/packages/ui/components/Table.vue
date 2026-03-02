<script setup lang="ts">
import { computed } from 'vue'
import type { TableProps } from '@cms/contracts'

const props = withDefaults(defineProps<TableProps>(), {
  striped: false,
  bordered: false,
})

const parsedHeaders = computed<string[]>(() => {
  if (!props.headers) return []
  if (Array.isArray(props.headers)) return props.headers
  try { return JSON.parse(props.headers as string) } catch { return [] }
})

const parsedRows = computed<string[][]>(() => {
  if (!props.rows) return []
  if (Array.isArray(props.rows)) return props.rows
  try { return JSON.parse(props.rows as string) } catch { return [] }
})
</script>

<template>
  <div class="table-block">
    <div class="table-block__wrap">
      <table
        class="table-block__table"
        :class="{
          'table-block__table--striped': striped,
          'table-block__table--bordered': bordered,
        }"
      >
        <caption v-if="caption" class="table-block__caption">{{ caption }}</caption>
        <thead v-if="parsedHeaders.length">
          <tr>
            <th
              v-for="(h, i) in parsedHeaders"
              :key="i"
              scope="col"
              class="table-block__th"
            >{{ h }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, ri) in parsedRows"
            :key="ri"
            class="table-block__row"
          >
            <td
              v-for="(cell, ci) in row"
              :key="ci"
              class="table-block__td"
            >{{ cell }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.table-block {
  padding: 1.5rem;
  overflow: hidden;
}

.table-block__wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.table-block__caption {
  caption-side: bottom;
  font-size: 0.8125rem;
  opacity: 0.55;
  text-align: center;
  padding-top: 0.5rem;
}

.table-block__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9375rem;
}

.table-block__th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 2px solid rgba(0, 0, 0, 0.12);
  background: rgba(0, 0, 0, 0.03);
}

.table-block__td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.07);
  vertical-align: top;
  line-height: 1.5;
}

/* Striped */
.table-block__table--striped .table-block__row:nth-child(even) .table-block__td {
  background: rgba(0, 0, 0, 0.025);
}

/* Bordered */
.table-block__table--bordered .table-block__th,
.table-block__table--bordered .table-block__td {
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.table-block__row:hover .table-block__td {
  background: rgba(88, 88, 200, 0.04);
}
</style>
