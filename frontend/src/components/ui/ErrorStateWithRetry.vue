<template>
  <div class="rounded-md bg-red-50 p-4 border border-red-200">
    <div class="flex">
      <div class="flex-shrink-0">
        <svg
          class="h-5 w-5 text-red-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
      <div class="ml-3 flex-1">
        <h3 class="text-sm font-medium text-red-800">
          {{ title || 'Operation Failed' }}
        </h3>
        <div class="mt-2 text-sm text-red-700">
          <p>{{ message || 'An error occurred. Please try again.' }}</p>
          <p v-if="details" class="mt-1 text-xs">{{ details }}</p>
        </div>

        <!-- Action Buttons -->
        <div class="mt-4 flex flex-wrap gap-3">
          <BaseButton
            v-if="showRetry"
            @click="handleRetry"
            variant="danger"
            size="sm"
            :loading="retrying"
            loading-text="Retrying..."
            aria-label="Retry operation"
          >
            <template #icon>
              <svg
                class="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </template>
            Retry
          </BaseButton>

          <BaseButton
            v-if="alternativeAction"
            @click="handleAlternative"
            variant="outline"
            size="sm"
            :aria-label="alternativeAction.label"
          >
            {{ alternativeAction.label }}
          </BaseButton>

          <BaseButton
            v-if="showSupport"
            @click="handleSupport"
            variant="ghost"
            size="sm"
            aria-label="Contact support"
          >
            Contact Support
          </BaseButton>
        </div>

        <!-- Error Code (for support) -->
        <div v-if="errorCode" class="mt-3 pt-3 border-t border-red-200">
          <p class="text-xs text-red-600">
            Error Code: <code class="bg-red-100 px-1 py-0.5 rounded">{{ errorCode }}</code>
          </p>
        </div>
      </div>

      <!-- Dismiss Button -->
      <div v-if="dismissible" class="ml-auto pl-3">
        <button
          @click="$emit('dismiss')"
          class="inline-flex rounded-md bg-red-50 text-red-500 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
          aria-label="Dismiss error"
        >
          <span class="sr-only">Dismiss</span>
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BaseButton from './BaseButton.vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  details: {
    type: String,
    default: ''
  },
  errorCode: {
    type: String,
    default: ''
  },
  showRetry: {
    type: Boolean,
    default: true
  },
  alternativeAction: {
    type: Object,
    default: null,
    validator: (value) => {
      if (!value) return true
      return value.label && typeof value.onClick === 'function'
    }
  },
  showSupport: {
    type: Boolean,
    default: false
  },
  dismissible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['retry', 'alternative', 'support', 'dismiss'])

const retrying = ref(false)

const handleRetry = async () => {
  retrying.value = true
  try {
    await emit('retry')
  } finally {
    retrying.value = false
  }
}

const handleAlternative = () => {
  if (props.alternativeAction && props.alternativeAction.onClick) {
    props.alternativeAction.onClick()
  }
  emit('alternative')
}

const handleSupport = () => {
  emit('support')
}
</script>
