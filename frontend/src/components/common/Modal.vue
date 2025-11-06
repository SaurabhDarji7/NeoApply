<template>
  <teleport to="body">
    <transition name="modal">
      <div
        v-if="modelValue"
        class="modal-backdrop"
        @click="handleBackdropClick"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <div :class="['modal-container', sizeClass]" @click.stop>
          <!-- Header -->
          <div v-if="$slots.header || title" class="modal-header">
            <h3 :id="titleId" class="modal-title">
              <slot name="header">{{ title }}</slot>
            </h3>
            <button
              v-if="showClose"
              @click="close"
              class="modal-close"
              aria-label="Close modal"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <slot></slot>
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer || showDefaultFooter" class="modal-footer">
            <slot name="footer">
              <div class="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  @click="cancel"
                >
                  {{ cancelText }}
                </Button>
                <Button
                  :variant="confirmVariant"
                  :loading="confirmLoading"
                  @click="confirm"
                >
                  {{ confirmText }}
                </Button>
              </div>
            </slot>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { computed, watch, onMounted, onUnmounted } from 'vue'
import Button from './Button.vue'

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
    validator: (value) => ['sm', 'md', 'lg', 'xl'].includes(value)
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
  },
  showDefaultFooter: {
    type: Boolean,
    default: false
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  confirmVariant: {
    type: String,
    default: 'primary'
  },
  confirmLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel', 'close'])

const titleId = computed(() => `modal-title-${Math.random().toString(36).substr(2, 9)}`)

const sizeClass = computed(() => `modal-${props.size}`)

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

const confirm = () => {
  emit('confirm')
}

const cancel = () => {
  emit('cancel')
  close()
}

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    close()
  }
}

const handleEscape = (event) => {
  if (event.key === 'Escape' && props.closeOnEscape && props.modelValue) {
    close()
  }
}

// Prevent body scroll when modal is open
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* Modal Backdrop */
.modal-backdrop {
  @apply fixed inset-0;
  @apply bg-gray-900 bg-opacity-50;
  @apply flex items-center justify-center;
  @apply p-4;
  z-index: 1040;
  backdrop-filter: blur(2px);
}

/* Modal Container */
.modal-container {
  @apply bg-white rounded-xl shadow-2xl;
  @apply flex flex-col;
  @apply max-h-[90vh];
  z-index: 1050;
}

/* Size Variants */
.modal-sm {
  @apply max-w-sm w-full;
}

.modal-md {
  @apply max-w-md w-full;
}

.modal-lg {
  @apply max-w-2xl w-full;
}

.modal-xl {
  @apply max-w-4xl w-full;
}

/* Modal Header */
.modal-header {
  @apply flex items-center justify-between;
  @apply px-6 py-4;
  @apply border-b border-gray-200;
}

.modal-title {
  @apply text-xl font-semibold text-gray-900;
}

.modal-close {
  @apply text-gray-400 hover:text-gray-600;
  @apply transition-colors duration-200;
  @apply rounded-lg p-1;
  @apply focus:outline-none focus:ring-2 focus:ring-gray-300;
}

/* Modal Body */
.modal-body {
  @apply px-6 py-5;
  @apply overflow-y-auto;
  @apply flex-1;
}

/* Modal Footer */
.modal-footer {
  @apply px-6 py-4;
  @apply border-t border-gray-200;
  @apply bg-gray-50;
}

/* Transition Animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container {
  transform: scale(0.9) translateY(-20px);
}

.modal-leave-to .modal-container {
  transform: scale(0.9) translateY(20px);
}

/* Responsive */
@media (max-width: 640px) {
  .modal-container {
    @apply max-w-full mx-4;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    @apply px-4;
  }
}
</style>
