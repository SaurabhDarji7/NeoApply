<template>
  <teleport to="body">
    <transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
        @click.self="handleBackdropClick"
      >
        <!-- Backdrop -->
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

          <!-- Center modal -->
          <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          <transition
            enter-active-class="transition ease-out duration-300"
            enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to-class="opacity-100 translate-y-0 sm:scale-100"
            leave-active-class="transition ease-in duration-200"
            leave-from-class="opacity-100 translate-y-0 sm:scale-100"
            leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div
              v-if="modelValue"
              :class="modalClasses"
              ref="modalRef"
              @keydown.esc="handleEscape"
            >
              <!-- Close Button -->
              <div v-if="showClose" class="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  class="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  @click="close"
                  aria-label="Close modal"
                >
                  <span class="sr-only">Close</span>
                  <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Header -->
              <div v-if="$slots.header || title" class="px-6 py-4 border-b border-gray-200">
                <slot name="header">
                  <h3 id="modal-title" class="text-xl font-semibold text-gray-900">
                    {{ title }}
                  </h3>
                </slot>
              </div>

              <!-- Body -->
              <div class="px-6 py-4">
                <slot></slot>
              </div>

              <!-- Footer -->
              <div v-if="$slots.footer" class="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <slot name="footer"></slot>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'xl', 'full'].includes(value)
  },
  showClose: {
    type: Boolean,
    default: true
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true
  },
  closeOnEscape: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const modalRef = ref(null)
const previousActiveElement = ref(null)

const modalClasses = computed(() => {
  const sizeClasses = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-2xl',
    lg: 'sm:max-w-4xl',
    xl: 'sm:max-w-6xl',
    full: 'sm:max-w-full sm:m-4'
  }

  return [
    'inline-block',
    'align-bottom',
    'bg-white',
    'rounded-lg',
    'text-left',
    'overflow-hidden',
    'shadow-xl',
    'transform',
    'transition-all',
    'sm:my-8',
    'sm:align-middle',
    'w-full',
    sizeClasses[props.size]
  ].join(' ')
})

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    close()
  }
}

const handleEscape = () => {
  if (props.closeOnEscape) {
    close()
  }
}

// Focus trap implementation
const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

const trapFocus = (e) => {
  if (!modalRef.value) return

  const focusable = modalRef.value.querySelectorAll(focusableElements)
  const firstFocusable = focusable[0]
  const lastFocusable = focusable[focusable.length - 1]

  if (e.key === 'Tab') {
    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus()
        e.preventDefault()
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus()
        e.preventDefault()
      }
    }
  }
}

watch(() => props.modelValue, async (newValue) => {
  if (newValue) {
    // Store currently focused element
    previousActiveElement.value = document.activeElement

    // Prevent body scroll
    document.body.style.overflow = 'hidden'

    // Focus first focusable element in modal
    await nextTick()
    if (modalRef.value) {
      const focusable = modalRef.value.querySelectorAll(focusableElements)
      if (focusable.length) {
        focusable[0].focus()
      }
    }

    // Add focus trap
    document.addEventListener('keydown', trapFocus)
  } else {
    // Restore body scroll
    document.body.style.overflow = ''

    // Remove focus trap
    document.removeEventListener('keydown', trapFocus)

    // Restore focus to previously focused element
    if (previousActiveElement.value) {
      previousActiveElement.value.focus()
    }
  }
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', trapFocus)
})
</script>
