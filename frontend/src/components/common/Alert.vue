<template>
  <div
    v-if="message"
    class="rounded-md p-4"
    :class="alertClasses"
  >
    <div class="flex">
      <div class="flex-shrink-0">
        <svg class="h-5 w-5" :class="iconColor" fill="currentColor" viewBox="0 0 20 20">
          <path v-if="type === 'error'" fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          <path v-else-if="type === 'success'" fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          <path v-else-if="type === 'warning'" fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          <path v-else fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
      </div>
      <div class="ml-3 flex-1">
        <p class="text-sm" :class="textColor">{{ message }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['error', 'warning', 'success', 'info'].includes(value)
  },
  message: {
    type: String,
    default: ''
  }
})

const alertClasses = computed(() => {
  const classes = {
    error: 'bg-red-50 border border-red-200',
    warning: 'bg-yellow-50 border border-yellow-200',
    success: 'bg-green-50 border border-green-200',
    info: 'bg-blue-50 border border-blue-200'
  }
  return classes[props.type]
})

const iconColor = computed(() => {
  const colors = {
    error: 'text-red-400',
    warning: 'text-yellow-400',
    success: 'text-green-400',
    info: 'text-blue-400'
  }
  return colors[props.type]
})

const textColor = computed(() => {
  const colors = {
    error: 'text-red-800',
    warning: 'text-yellow-800',
    success: 'text-green-800',
    info: 'text-blue-800'
  }
  return colors[props.type]
})
</script>
