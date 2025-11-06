<template>
  <div class="space-y-4">
    <!-- Search and Filter Bar -->
    <div class="flex flex-col sm:flex-row gap-4">
      <!-- Search Input -->
      <div class="flex-1 relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            class="h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <input
          type="text"
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          :placeholder="placeholder"
          :aria-label="ariaLabel || 'Search'"
        />
        <!-- Clear Button -->
        <button
          v-if="modelValue"
          @click="$emit('update:modelValue', '')"
          class="absolute inset-y-0 right-0 pr-3 flex items-center"
          aria-label="Clear search"
        >
          <svg
            class="h-5 w-5 text-gray-400 hover:text-gray-600"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>

      <!-- Filter Dropdown (if filters provided) -->
      <div v-if="filters && filters.length > 0" class="relative">
        <select
          :value="selectedFilter"
          @change="$emit('update:selectedFilter', $event.target.value)"
          class="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
          :aria-label="filterAriaLabel || 'Filter options'"
        >
          <option value="">All {{ filterLabel || 'Items' }}</option>
          <option
            v-for="filter in filters"
            :key="filter.value"
            :value="filter.value"
          >
            {{ filter.label }}
          </option>
        </select>
      </div>

      <!-- Sort Dropdown (if sorts provided) -->
      <div v-if="sorts && sorts.length > 0" class="relative">
        <select
          :value="selectedSort"
          @change="$emit('update:selectedSort', $event.target.value)"
          class="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
          :aria-label="sortAriaLabel || 'Sort options'"
        >
          <option
            v-for="sort in sorts"
            :key="sort.value"
            :value="sort.value"
          >
            {{ sort.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Active Filters Display -->
    <div v-if="showActiveFilters && (modelValue || selectedFilter)" class="flex items-center gap-2 flex-wrap">
      <span class="text-sm text-gray-600">Active filters:</span>

      <BaseBadge
        v-if="modelValue"
        variant="info"
        size="sm"
        :show-icon="false"
      >
        Search: "{{ modelValue }}"
        <button
          @click="$emit('update:modelValue', '')"
          class="ml-1 hover:text-blue-800"
          aria-label="Clear search filter"
        >
          ×
        </button>
      </BaseBadge>

      <BaseBadge
        v-if="selectedFilter"
        variant="info"
        size="sm"
        :show-icon="false"
      >
        {{ getFilterLabel(selectedFilter) }}
        <button
          @click="$emit('update:selectedFilter', '')"
          class="ml-1 hover:text-blue-800"
          aria-label="Clear status filter"
        >
          ×
        </button>
      </BaseBadge>

      <button
        v-if="modelValue || selectedFilter"
        @click="clearAll"
        class="text-xs text-blue-600 hover:text-blue-800 font-medium"
      >
        Clear all
      </button>
    </div>

    <!-- Results Count -->
    <div v-if="showResultsCount && resultsCount !== null" class="text-sm text-gray-600">
      Showing {{ resultsCount }} {{ resultsCount === 1 ? 'result' : 'results' }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseBadge from './BaseBadge.vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Search...'
  },
  ariaLabel: {
    type: String,
    default: ''
  },
  filters: {
    type: Array,
    default: null
  },
  selectedFilter: {
    type: String,
    default: ''
  },
  filterLabel: {
    type: String,
    default: 'Items'
  },
  filterAriaLabel: {
    type: String,
    default: ''
  },
  sorts: {
    type: Array,
    default: null
  },
  selectedSort: {
    type: String,
    default: ''
  },
  sortAriaLabel: {
    type: String,
    default: ''
  },
  showActiveFilters: {
    type: Boolean,
    default: true
  },
  showResultsCount: {
    type: Boolean,
    default: true
  },
  resultsCount: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'update:selectedFilter', 'update:selectedSort'])

const getFilterLabel = (value) => {
  const filter = props.filters?.find(f => f.value === value)
  return filter ? filter.label : value
}

const clearAll = () => {
  emit('update:modelValue', '')
  emit('update:selectedFilter', '')
}
</script>
