<template>
  <div class="w-full">
    <!-- Label -->
    <div v-if="label || showPercentage" class="flex justify-between items-center mb-2">
      <span v-if="label" class="text-sm font-medium text-gray-700">{{ label }}</span>
      <span v-if="showPercentage" class="text-sm font-medium text-gray-700">{{ progress }}%</span>
    </div>

    <!-- Progress Bar -->
    <div :class="containerClasses" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100">
      <div
        :class="barClasses"
        :style="{ width: progress + '%' }"
      >
        <span v-if="showLabel" class="text-xs font-medium text-white px-2">
          {{ progress }}%
        </span>
      </div>
    </div>

    <!-- Status Text -->
    <p v-if="statusText" class="text-xs text-gray-500 mt-2">{{ statusText }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  progress: {
    type: Number,
    required: true,
    validator: (value) => value >= 0 && value <= 100
  },
  label: {
    type: String,
    default: ''
  },
  statusText: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'success', 'warning', 'error'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  showPercentage: {
    type: Boolean,
    default: true
  },
  showLabel: {
    type: Boolean,
    default: false
  },
  animated: {
    type: Boolean,
    default: true
  }
})

const containerClasses = computed(() => {
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  }

  return [
    'w-full',
    'bg-gray-200',
    'rounded-full',
    'overflow-hidden',
    sizeClasses[props.size]
  ].join(' ')
})

const barClasses = computed(() => {
  const variantClasses = {
    primary: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600'
  }

  const animationClasses = props.animated
    ? 'transition-all duration-500 ease-out'
    : ''

  return [
    'h-full',
    'rounded-full',
    'flex',
    'items-center',
    'justify-center',
    variantClasses[props.variant],
    animationClasses
  ].filter(Boolean).join(' ')
})
</script>
