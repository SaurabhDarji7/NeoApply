<template>
  <div class="text-center py-8">
    <!-- Success Icon -->
    <div class="flex justify-center mb-6">
      <div class="rounded-full bg-green-100 p-6">
        <svg class="w-20 h-20 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
    </div>

    <!-- Congratulations Text -->
    <h1 class="text-3xl font-bold text-gray-900 mb-4">
      You're All Set! 🎉
    </h1>

    <p class="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
      Congratulations! Your profile is ready. Let's start applying to your dream jobs.
    </p>

    <!-- Completion Summary -->
    <div class="max-w-md mx-auto bg-gray-50 rounded-lg p-6 mb-8">
      <h3 class="font-semibold text-gray-900 mb-4">What You've Completed:</h3>
      <ul class="space-y-3 text-left">
        <li class="flex items-start">
          <svg class="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          <div>
            <p class="text-sm font-medium text-gray-900">Profile Completed</p>
            <p class="text-xs text-gray-600">Your contact information is saved</p>
          </div>
        </li>
        <li class="flex items-start">
          <svg
            class="w-5 h-5 mr-3 mt-0.5 flex-shrink-0"
            :class="hasResume ? 'text-green-500' : 'text-gray-400'"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          <div>
            <p class="text-sm font-medium" :class="hasResume ? 'text-gray-900' : 'text-gray-500'">
              {{ hasResume ? 'Resume Uploaded' : 'Resume Not Uploaded' }}
            </p>
            <p class="text-xs text-gray-600">
              {{ hasResume ? 'Your resume has been parsed and saved' : 'You can upload one later from the dashboard' }}
            </p>
          </div>
        </li>
      </ul>
    </div>

    <!-- Next Steps -->
    <div class="max-w-2xl mx-auto bg-blue-50 rounded-lg p-6 mb-8">
      <h3 class="font-semibold text-gray-900 mb-4">What's Next?</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        <div class="flex items-start">
          <div class="rounded-full bg-blue-100 p-2 mr-3">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">Find Jobs</p>
            <p class="text-xs text-gray-600">Add job descriptions to track opportunities</p>
          </div>
        </div>

        <div class="flex items-start">
          <div class="rounded-full bg-blue-100 p-2 mr-3">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">Create Templates</p>
            <p class="text-xs text-gray-600">Customize resumes for different jobs</p>
          </div>
        </div>

        <div class="flex items-start">
          <div class="rounded-full bg-blue-100 p-2 mr-3">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">Install Extension</p>
            <p class="text-xs text-gray-600">Apply faster with our Chrome extension</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Chrome Extension CTA -->
    <div class="max-w-2xl mx-auto bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
      <div class="flex items-start">
        <div class="rounded-full bg-purple-100 p-3 mr-4">
          <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div class="text-left flex-1">
          <h4 class="font-semibold text-gray-900 mb-2">Get the Chrome Extension</h4>
          <p class="text-sm text-gray-600 mb-3">
            Apply to jobs with a single click. Our extension auto-fills application forms using your profile data.
          </p>
          <a
            href="#"
            class="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
            @click.prevent="$emit('install-extension')"
          >
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
            Install Extension
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CompletionStep',
  props: {
    hasResume: {
      type: Boolean,
      default: false
    }
  },
  emits: ['install-extension']
}
</script>
