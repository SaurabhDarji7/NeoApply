<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClasses"
    @click="handleClick"
  >
    <span v-if="loading" class="btn-spinner">
      <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </span>
    <slot></slot>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'ghost', 'danger', 'success'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  type: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'submit', 'reset'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  fullWidth: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const buttonClasses = computed(() => {
  const classes = ['btn']

  // Variant classes
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    success: 'btn-success'
  }
  classes.push(variantClasses[props.variant])

  // Size classes
  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg'
  }
  classes.push(sizeClasses[props.size])

  // Full width
  if (props.fullWidth) {
    classes.push('w-full')
  }

  // Loading state
  if (props.loading) {
    classes.push('btn-loading')
  }

  return classes.join(' ')
})

const handleClick = (event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped>
/* Base Button Styles */
.btn {
  @apply inline-flex items-center justify-center gap-2;
  @apply font-medium rounded-lg;
  @apply transition-all duration-200 ease-in-out;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Primary Action - Most important */
.btn-primary {
  @apply bg-primary-600 text-white;
  @apply hover:bg-primary-700 active:bg-primary-800;
  @apply focus:ring-primary-500;
  @apply shadow-sm hover:shadow-md;
}

.btn-primary:disabled {
  @apply bg-primary-600 hover:bg-primary-600;
}

/* Secondary Action - Alternative action */
.btn-secondary {
  @apply bg-white text-gray-700;
  @apply border border-gray-300;
  @apply hover:bg-gray-50 active:bg-gray-100;
  @apply focus:ring-gray-500;
  @apply shadow-sm;
}

.btn-secondary:disabled {
  @apply bg-white hover:bg-white;
}

/* Ghost/Tertiary - Low emphasis */
.btn-ghost {
  @apply bg-transparent text-gray-700;
  @apply hover:bg-gray-100 active:bg-gray-200;
  @apply focus:ring-gray-500;
}

.btn-ghost:disabled {
  @apply hover:bg-transparent;
}

/* Danger/Destructive - Delete, remove */
.btn-danger {
  @apply bg-red-600 text-white;
  @apply hover:bg-red-700 active:bg-red-800;
  @apply focus:ring-red-500;
  @apply shadow-sm hover:shadow-md;
}

.btn-danger:disabled {
  @apply bg-red-600 hover:bg-red-600;
}

/* Success - Positive actions */
.btn-success {
  @apply bg-secondary-600 text-white;
  @apply hover:bg-secondary-700 active:bg-secondary-800;
  @apply focus:ring-secondary-500;
  @apply shadow-sm hover:shadow-md;
}

.btn-success:disabled {
  @apply bg-secondary-600 hover:bg-secondary-600;
}

/* Size Variants */
.btn-sm {
  @apply px-3 py-1.5 text-sm;
}

.btn-md {
  @apply px-5 py-2.5 text-base;
}

.btn-lg {
  @apply px-6 py-3 text-lg;
}

/* Loading State */
.btn-loading {
  @apply relative;
}

.btn-spinner {
  @apply inline-flex items-center;
}

/* Hover/Active Micro-interactions */
.btn:not(:disabled):hover {
  @apply transform scale-[1.02];
}

.btn:not(:disabled):active {
  @apply transform scale-[0.98];
}
</style>
