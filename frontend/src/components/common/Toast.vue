<template>
  <transition name="toast">
    <div
      v-if="visible"
      :class="['toast', toastVariant]"
      role="alert"
      @mouseenter="pauseTimer"
      @mouseleave="resumeTimer"
    >
      <div class="toast-icon">
        <component :is="iconComponent" />
      </div>
      <div class="toast-content">
        <p class="toast-title">{{ title }}</p>
        <p v-if="message" class="toast-message">{{ message }}</p>
      </div>
      <button @click="close" class="toast-close" aria-label="Close notification">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'

const props = defineProps({
  id: {
    type: [String, Number],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  duration: {
    type: Number,
    default: 5000 // 5 seconds
  }
})

const emit = defineEmits(['close'])

const visible = ref(false)
let timer = null
let remainingTime = props.duration
let startTime = null

const toastVariant = computed(() => `toast-${props.type}`)

// Icon components for different toast types
const iconComponent = computed(() => {
  const icons = {
    success: () => h('svg', {
      class: 'w-5 h-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M5 13l4 4L19 7'
      })
    ]),
    error: () => h('svg', {
      class: 'w-5 h-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M6 18L18 6M6 6l12 12'
      })
    ]),
    warning: () => h('svg', {
      class: 'w-5 h-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
      })
    ]),
    info: () => h('svg', {
      class: 'w-5 h-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      })
    ])
  }
  return icons[props.type] || icons.info
})

const startTimer = () => {
  if (props.duration > 0) {
    startTime = Date.now()
    timer = setTimeout(() => {
      close()
    }, remainingTime)
  }
}

const pauseTimer = () => {
  if (timer) {
    clearTimeout(timer)
    remainingTime -= Date.now() - startTime
  }
}

const resumeTimer = () => {
  if (props.duration > 0 && remainingTime > 0) {
    startTimer()
  }
}

const close = () => {
  visible.value = false
  if (timer) {
    clearTimeout(timer)
  }
  setTimeout(() => {
    emit('close', props.id)
  }, 300) // Wait for exit animation
}

onMounted(() => {
  visible.value = true
  startTimer()
})
</script>

<style scoped>
.toast {
  @apply fixed top-4 right-4 max-w-md;
  @apply bg-white rounded-lg shadow-lg border;
  @apply flex items-start gap-3 p-4;
  @apply transition-all duration-300;
  z-index: 9999;
}

.toast-icon {
  @apply flex-shrink-0;
}

.toast-content {
  @apply flex-1 min-w-0;
}

.toast-title {
  @apply font-semibold text-sm text-gray-900;
}

.toast-message {
  @apply text-sm text-gray-600 mt-1;
}

.toast-close {
  @apply flex-shrink-0 text-gray-400 hover:text-gray-600;
  @apply transition-colors duration-200;
  @apply focus:outline-none focus:ring-2 focus:ring-gray-300 rounded;
}

/* Type-specific styles */
.toast-success {
  @apply border-green-200 bg-green-50;
}

.toast-success .toast-icon {
  @apply text-green-600;
}

.toast-error {
  @apply border-red-200 bg-red-50;
}

.toast-error .toast-icon {
  @apply text-red-600;
}

.toast-warning {
  @apply border-amber-200 bg-amber-50;
}

.toast-warning .toast-icon {
  @apply text-amber-600;
}

.toast-info {
  @apply border-blue-200 bg-blue-50;
}

.toast-info .toast-icon {
  @apply text-blue-600;
}

/* Transition animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>
