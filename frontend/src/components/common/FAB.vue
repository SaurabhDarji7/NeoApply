<template>
  <button
    :class="['fab', variantClass, sizeClass]"
    :disabled="disabled"
    :aria-label="ariaLabel"
    @click="handleClick"
  >
    <span v-if="loading" class="fab-spinner">
      <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </span>
    <span v-else>
      <slot>
        <!-- Default Plus Icon -->
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
      </slot>
    </span>

    <!-- Optional label for extended FAB -->
    <span v-if="label" class="fab-label">{{ label }}</span>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'success', 'danger'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  position: {
    type: String,
    default: 'bottom-right',
    validator: (value) => ['bottom-right', 'bottom-left', 'top-right', 'top-left'].includes(value)
  },
  label: {
    type: String,
    default: ''
  },
  ariaLabel: {
    type: String,
    default: 'Add new item'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const variantClass = computed(() => `fab-${props.variant}`)
const sizeClass = computed(() => `fab-${props.size}`)

const handleClick = (event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped>
/* Base FAB Styles - Following Humi Pattern */
.fab {
  @apply fixed rounded-full shadow-lg;
  @apply flex items-center justify-center gap-2;
  @apply transition-all duration-300 ease-in-out;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  z-index: 50;
}

/* Default position: bottom-right */
.fab {
  bottom: 2rem;
  right: 2rem;
}

/* Hover effects */
.fab:not(:disabled):hover {
  @apply shadow-xl transform scale-105;
}

.fab:not(:disabled):active {
  @apply transform scale-95;
}

/* Variant Styles */
.fab-primary {
  @apply bg-primary-600 text-white;
  @apply hover:bg-primary-700;
  @apply focus:ring-primary-500;
}

.fab-secondary {
  @apply bg-white text-gray-700 border-2 border-gray-300;
  @apply hover:bg-gray-50;
  @apply focus:ring-gray-500;
}

.fab-success {
  @apply bg-secondary-600 text-white;
  @apply hover:bg-secondary-700;
  @apply focus:ring-secondary-500;
}

.fab-danger {
  @apply bg-red-600 text-white;
  @apply hover:bg-red-700;
  @apply focus:ring-red-500;
}

/* Size Variants */
.fab-sm {
  @apply w-12 h-12;
}

.fab-sm svg {
  @apply w-5 h-5;
}

.fab-md {
  @apply w-14 h-14;
}

.fab-md svg {
  @apply w-6 h-6;
}

.fab-lg {
  @apply w-16 h-16;
}

.fab-lg svg {
  @apply w-7 h-7;
}

/* Extended FAB (with label) */
.fab-label {
  @apply font-medium text-sm px-2;
}

.fab:has(.fab-label) {
  @apply rounded-full px-6;
  width: auto;
}

/* Loading State */
.fab-spinner {
  @apply inline-flex items-center;
}

/* Disabled State */
.fab:disabled {
  @apply hover:shadow-lg hover:scale-100;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .fab {
    bottom: 1rem;
    right: 1rem;
  }

  .fab-lg {
    @apply w-14 h-14;
  }
}
</style>
