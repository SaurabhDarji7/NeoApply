<template>
  <div class="table-container">
    <div v-if="loading" class="table-loading">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <p class="text-gray-600 mt-2">{{ loadingText }}</p>
    </div>

    <div v-else-if="error" class="table-error">
      <svg class="w-12 h-12 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <p class="text-red-600">{{ error }}</p>
    </div>

    <div v-else class="table-wrapper">
      <table class="table">
        <thead class="table-head">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="['table-header', column.headerClass]"
              @click="column.sortable ? handleSort(column.key) : null"
            >
              <div :class="['table-header-content', { 'cursor-pointer select-none': column.sortable }]">
                <span>{{ column.label }}</span>
                <span v-if="column.sortable" class="table-sort-icon">
                  <svg
                    v-if="sortKey === column.key && sortOrder === 'asc'"
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                  </svg>
                  <svg
                    v-else-if="sortKey === column.key && sortOrder === 'desc'"
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                  <svg
                    v-else
                    class="w-4 h-4 opacity-30"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
                  </svg>
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="table-body">
          <tr
            v-for="(row, index) in displayedData"
            :key="row[rowKey] || index"
            :class="['table-row', { 'cursor-pointer': clickableRows }]"
            @click="handleRowClick(row)"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              :class="['table-cell', column.cellClass]"
            >
              <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
                {{ row[column.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="displayedData.length === 0" class="table-empty">
        <slot name="empty">
          <svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
          </svg>
          <p class="text-gray-600">{{ emptyText }}</p>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  columns: {
    type: Array,
    required: true
    // Example: [{ key: 'name', label: 'Name', sortable: true, headerClass: '', cellClass: '' }]
  },
  data: {
    type: Array,
    required: true
  },
  rowKey: {
    type: String,
    default: 'id'
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  loadingText: {
    type: String,
    default: 'Loading...'
  },
  emptyText: {
    type: String,
    default: 'No data available'
  },
  clickableRows: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['row-click', 'sort'])

const sortKey = ref('')
const sortOrder = ref('asc')

const displayedData = computed(() => {
  let data = [...props.data]

  // Apply sorting
  if (sortKey.value) {
    data.sort((a, b) => {
      const aVal = a[sortKey.value]
      const bVal = b[sortKey.value]

      if (aVal === bVal) return 0

      const comparison = aVal < bVal ? -1 : 1
      return sortOrder.value === 'asc' ? comparison : -comparison
    })
  }

  return data
})

const handleSort = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }

  emit('sort', { key: sortKey.value, order: sortOrder.value })
}

const handleRowClick = (row) => {
  if (props.clickableRows) {
    emit('row-click', row)
  }
}
</script>

<style scoped>
.table-container {
  @apply relative;
}

.table-loading,
.table-error,
.table-empty {
  @apply text-center py-12;
}

.table-wrapper {
  @apply overflow-x-auto;
}

/* Table */
.table {
  @apply w-full border-collapse;
}

/* Table Head */
.table-head {
  @apply bg-gray-50 border-b border-gray-200;
}

.table-header {
  @apply px-6 py-3 text-left;
  @apply text-xs font-medium text-gray-500 uppercase tracking-wider;
}

.table-header-content {
  @apply flex items-center gap-1;
}

.table-sort-icon {
  @apply inline-flex items-center;
}

/* Table Body */
.table-body {
  @apply bg-white divide-y divide-gray-200;
}

.table-row {
  @apply transition-colors duration-150;
}

.table-row:hover {
  @apply bg-gray-50;
}

.table-row.cursor-pointer:hover {
  @apply bg-gray-100;
}

.table-cell {
  @apply px-6 py-4 text-sm text-gray-900;
}

/* Responsive */
@media (max-width: 640px) {
  .table-header,
  .table-cell {
    @apply px-4 py-3;
  }
}
</style>
