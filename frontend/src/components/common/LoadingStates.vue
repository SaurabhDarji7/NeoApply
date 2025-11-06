<template>
  <div class="loading-states">
    <!-- Spinner Loader -->
    <div v-if="type === 'spinner'" class="flex justify-center items-center p-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Parsing Status -->
    <div v-else-if="type === 'parsing'" class="bg-blue-50 border-l-4 border-blue-500 rounded-lg shadow p-6">
      <div class="flex items-center gap-4">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <div>
          <h3 class="text-lg font-semibold text-blue-900">{{ title || 'Parsing in progress...' }}</h3>
          <p class="text-sm text-blue-700">{{ message || 'Please wait while we process your document' }}</p>
        </div>
      </div>
    </div>

    <!-- Scraping Status -->
    <div v-else-if="type === 'scraping'" class="bg-purple-50 border-l-4 border-purple-500 rounded-lg shadow p-6">
      <div class="flex items-center gap-4">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
        <div>
          <h3 class="text-lg font-semibold text-purple-900">{{ title || 'Scraping job description...' }}</h3>
          <p class="text-sm text-purple-700">{{ message || 'Fetching job information from the URL' }}</p>
        </div>
      </div>
    </div>

    <!-- Skeleton Loader -->
    <div v-else-if="type === 'skeleton'" class="space-y-4 p-6">
      <div class="animate-pulse space-y-4">
        <!-- Header skeleton -->
        <div class="h-8 bg-gray-300 rounded w-3/4"></div>
        <div class="h-4 bg-gray-300 rounded w-1/2"></div>

        <!-- Content skeleton -->
        <div class="space-y-3 pt-4">
          <div class="h-4 bg-gray-300 rounded"></div>
          <div class="h-4 bg-gray-300 rounded"></div>
          <div class="h-4 bg-gray-300 rounded w-5/6"></div>
        </div>

        <!-- More content -->
        <div class="space-y-3 pt-4">
          <div class="h-4 bg-gray-300 rounded"></div>
          <div class="h-4 bg-gray-300 rounded w-4/5"></div>
        </div>
      </div>
    </div>

    <!-- Progress Animation -->
    <div v-else-if="type === 'progress'" class="bg-white rounded-lg shadow p-6">
      <div class="mb-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ title || 'Processing...' }}</h3>
        <p class="text-sm text-gray-600">{{ message }}</p>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2.5">
        <div
          class="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
          :style="{ width: progress + '%' }"
        ></div>
      </div>
      <p class="text-xs text-gray-500 mt-2 text-right">{{ progress }}%</p>
    </div>

    <!-- Pulsing Dots -->
    <div v-else-if="type === 'dots'" class="flex justify-center items-center p-8 gap-2">
      <div class="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0s"></div>
      <div class="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
      <div class="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
    </div>

    <!-- Default -->
    <div v-else class="flex justify-center items-center p-8">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">{{ message || 'Loading...' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'spinner',
    validator: (value) => {
      return ['spinner', 'parsing', 'scraping', 'skeleton', 'progress', 'dots'].includes(value)
    }
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  progress: {
    type: Number,
    default: 0,
    validator: (value) => value >= 0 && value <= 100
  }
})
</script>

<style scoped>
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-bounce {
  animation: bounce 1s infinite;
}
</style>
