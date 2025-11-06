<template>
  <div :class="containerClasses" aria-busy="true" aria-live="polite">
    <!-- Card Skeleton -->
    <div v-if="type === 'card'" class="animate-pulse">
      <div class="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
      <div class="h-4 bg-gray-300 rounded w-full mb-3"></div>
      <div class="h-4 bg-gray-300 rounded w-5/6 mb-3"></div>
      <div class="h-4 bg-gray-300 rounded w-4/5"></div>
    </div>

    <!-- List Skeleton -->
    <div v-else-if="type === 'list'" class="animate-pulse space-y-4">
      <div v-for="i in count" :key="i" class="flex items-center space-x-4">
        <div class="rounded-full bg-gray-300 h-12 w-12"></div>
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-gray-300 rounded w-3/4"></div>
          <div class="h-3 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    </div>

    <!-- Table Skeleton -->
    <div v-else-if="type === 'table'" class="animate-pulse">
      <div class="grid grid-cols-4 gap-4 mb-4">
        <div v-for="i in 4" :key="i" class="h-4 bg-gray-300 rounded"></div>
      </div>
      <div v-for="i in count" :key="i" class="grid grid-cols-4 gap-4 mb-3">
        <div v-for="j in 4" :key="j" class="h-4 bg-gray-300 rounded"></div>
      </div>
    </div>

    <!-- Text Skeleton -->
    <div v-else-if="type === 'text'" class="animate-pulse space-y-3">
      <div v-for="i in count" :key="i" class="h-4 bg-gray-300 rounded" :style="{ width: getRandomWidth() }"></div>
    </div>

    <!-- Form Skeleton -->
    <div v-else-if="type === 'form'" class="animate-pulse space-y-6">
      <div v-for="i in count" :key="i">
        <div class="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
        <div class="h-10 bg-gray-300 rounded w-full"></div>
      </div>
    </div>

    <!-- Custom Skeleton -->
    <div v-else class="animate-pulse">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'card',
    validator: (value) => ['card', 'list', 'table', 'text', 'form', 'custom'].includes(value)
  },
  count: {
    type: Number,
    default: 3
  },
  padding: {
    type: Boolean,
    default: true
  }
})

const containerClasses = computed(() => {
  return props.padding ? 'p-6' : ''
})

const getRandomWidth = () => {
  const widths = ['75%', '85%', '90%', '100%', '80%']
  return widths[Math.floor(Math.random() * widths.length)]
}
</script>
