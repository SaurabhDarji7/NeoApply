<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl w-full">
      <!-- Progress Steps -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div
            v-for="step in steps"
            :key="step.number"
            class="flex-1"
          >
            <div class="flex items-center">
              <!-- Step Circle -->
              <div
                class="flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200"
                :class="{
                  'bg-blue-600 border-blue-600 text-white': currentStep >= step.number,
                  'bg-white border-gray-300 text-gray-500': currentStep < step.number
                }"
              >
                <svg
                  v-if="currentStep > step.number"
                  class="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span v-else class="text-sm font-semibold">{{ step.number }}</span>
              </div>

              <!-- Step Label -->
              <div class="ml-3 hidden sm:block">
                <p
                  class="text-sm font-medium transition-colors"
                  :class="{
                    'text-blue-600': currentStep === step.number,
                    'text-gray-900': currentStep > step.number,
                    'text-gray-500': currentStep < step.number
                  }"
                >
                  {{ step.label }}
                </p>
              </div>

              <!-- Connecting Line -->
              <div
                v-if="step.number < steps.length"
                class="flex-1 h-0.5 mx-4"
                :class="{
                  'bg-blue-600': currentStep > step.number,
                  'bg-gray-300': currentStep <= step.number
                }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step Content Card -->
      <div class="bg-white rounded-lg shadow-xl p-8">
        <slot></slot>
      </div>

      <!-- Navigation Buttons -->
      <div class="mt-6 flex justify-between">
        <button
          v-if="currentStep > 1"
          @click="$emit('prev')"
          type="button"
          class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
          Back
        </button>
        <div v-else></div>

        <div class="flex space-x-3">
          <button
            v-if="showSkip"
            @click="$emit('skip')"
            type="button"
            class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Skip for now
          </button>

          <button
            v-if="currentStep < totalSteps"
            @click="$emit('next')"
            :disabled="!canProceed"
            type="button"
            class="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <svg class="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </button>

          <button
            v-if="currentStep === totalSteps"
            @click="$emit('complete')"
            :disabled="!canProceed"
            type="button"
            class="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Complete Setup
            <svg class="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WizardContainer',
  props: {
    currentStep: {
      type: Number,
      required: true
    },
    totalSteps: {
      type: Number,
      required: true
    },
    canProceed: {
      type: Boolean,
      default: true
    },
    showSkip: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    steps() {
      const stepLabels = ['Welcome', 'Profile', 'Resume', 'Complete']
      return stepLabels.map((label, index) => ({
        number: index + 1,
        label
      }))
    }
  },
  emits: ['next', 'prev', 'skip', 'complete']
}
</script>
