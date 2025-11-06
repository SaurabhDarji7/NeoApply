<template>
  <div class="error-display">
    <!-- Error Card -->
    <div class="bg-red-50 border-l-4 border-red-500 rounded-lg shadow p-6">
      <div class="flex items-start gap-4">
        <!-- Error Icon -->
        <div class="flex-shrink-0">
          <svg
            class="h-10 w-10 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <!-- Error Content -->
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-red-900 mb-1">
            {{ title || 'An error occurred' }}
          </h3>
          <p class="text-sm text-red-700 mb-4">
            {{ message || 'Something went wrong. Please try again.' }}
          </p>

          <!-- Error Details (if provided) -->
          <div v-if="details" class="bg-red-100 rounded p-3 mb-4">
            <p class="text-xs font-mono text-red-800">{{ details }}</p>
          </div>

          <!-- Suggestions -->
          <div v-if="suggestions && suggestions.length > 0" class="mb-4">
            <p class="text-sm font-medium text-red-900 mb-2">Suggestions:</p>
            <ul class="list-disc list-inside space-y-1">
              <li
                v-for="(suggestion, index) in suggestions"
                :key="index"
                class="text-sm text-red-700"
              >
                {{ suggestion }}
              </li>
            </ul>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              v-if="showRetry"
              @click="$emit('retry')"
              class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Try Again
            </button>
            <button
              v-if="showDismiss"
              @click="$emit('dismiss')"
              class="px-4 py-2 bg-white text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors text-sm font-medium"
            >
              Dismiss
            </button>
            <button
              v-if="showSupport"
              @click="$emit('contact-support')"
              class="px-4 py-2 bg-white text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors text-sm font-medium"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Common Error Suggestions -->
    <div v-if="showCommonIssues" class="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h4 class="text-sm font-semibold text-yellow-900 mb-2">Common Issues:</h4>
      <ul class="text-xs text-yellow-800 space-y-1">
        <li>• Check your internet connection</li>
        <li>• Ensure the file format is supported (PDF, DOCX, TXT)</li>
        <li>• Verify the file size is under 10 MB</li>
        <li>• Make sure the URL is accessible and valid</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
defineProps({
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
  suggestions: {
    type: Array,
    default: () => []
  },
  showRetry: {
    type: Boolean,
    default: true
  },
  showDismiss: {
    type: Boolean,
    default: true
  },
  showSupport: {
    type: Boolean,
    default: false
  },
  showCommonIssues: {
    type: Boolean,
    default: true
  }
})

defineEmits(['retry', 'dismiss', 'contact-support'])
</script>

<style scoped>
/* Add any custom styles here */
</style>
