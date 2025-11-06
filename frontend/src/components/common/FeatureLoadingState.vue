<template>
  <div class="flex flex-col items-center justify-center space-y-6 py-8">
    <!-- Progress Bar -->
    <div class="w-full max-w-md">
      <div class="relative pt-1">
        <div class="flex mb-2 items-center justify-between">
          <div>
            <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
              {{ statusText }}
            </span>
          </div>
          <div class="text-right">
            <span class="text-xs font-semibold inline-block text-blue-600">
              {{ progress }}%
            </span>
          </div>
        </div>
        <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
          <div
            :style="{ width: `${progress}%` }"
            class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
          ></div>
        </div>
      </div>
    </div>

    <!-- Animated Icon -->
    <div class="flex justify-center">
      <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
    </div>

    <!-- Feature Tips (Rotating) -->
    <div class="text-center max-w-lg px-4">
      <transition name="fade" mode="out-in">
        <div :key="currentTip.id" class="space-y-3">
          <div class="flex items-start justify-center space-x-3">
            <svg class="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
            <div class="text-left">
              <h3 class="font-semibold text-gray-900">{{ currentTip.title }}</h3>
              <p class="text-sm text-gray-600 mt-1">{{ currentTip.description }}</p>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FeatureLoadingState',
  props: {
    statusText: {
      type: String,
      default: 'Processing'
    },
    progress: {
      type: Number,
      default: 0,
      validator: value => value >= 0 && value <= 100
    },
    tips: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      currentTipIndex: 0,
      tipRotationInterval: null,
      defaultTips: [
        {
          id: 1,
          title: 'Chrome Extension Available',
          description: 'Use our browser extension to apply to jobs faster. Auto-fill application forms with your saved profile data.'
        },
        {
          id: 2,
          title: 'Smart Resume Parsing',
          description: 'Our AI extracts key information from your resume, making it easy to customize for different job applications.'
        },
        {
          id: 3,
          title: 'Multiple Resume Templates',
          description: 'Create and save multiple resume versions tailored for different job types or industries.'
        },
        {
          id: 4,
          title: 'Job Description Analysis',
          description: 'We analyze job postings to help you understand requirements and tailor your application accordingly.'
        },
        {
          id: 5,
          title: 'Application Tracking',
          description: 'Keep track of all your job applications in one place. Never lose track of where you applied.'
        },
        {
          id: 6,
          title: 'One-Click Apply',
          description: 'With our extension, you can apply to jobs with a single click, saving hours of repetitive form filling.'
        }
      ]
    }
  },
  computed: {
    activeTips() {
      return this.tips.length > 0 ? this.tips : this.defaultTips
    },
    currentTip() {
      return this.activeTips[this.currentTipIndex]
    }
  },
  mounted() {
    // Rotate tips every 5 seconds
    this.tipRotationInterval = setInterval(() => {
      this.currentTipIndex = (this.currentTipIndex + 1) % this.activeTips.length
    }, 5000)
  },
  beforeUnmount() {
    if (this.tipRotationInterval) {
      clearInterval(this.tipRotationInterval)
    }
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
