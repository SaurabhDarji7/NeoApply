<template>
  <div class="text-center py-8">
    <!-- Icon/Logo -->
    <div class="flex justify-center mb-6">
      <div class="rounded-full bg-blue-100 p-6">
        <svg class="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
    </div>

    <!-- Welcome Text -->
    <h1 class="text-3xl font-bold text-gray-900 mb-4">
      Welcome to NeoApply!
    </h1>

    <p class="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
      We're excited to help you streamline your job application process.
      Let's get you set up in just a few quick steps.
    </p>

    <!-- Feature Highlights -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
      <div class="bg-blue-50 rounded-lg p-6">
        <div class="flex justify-center mb-4">
          <div class="rounded-full bg-blue-100 p-3">
            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        </div>
        <h3 class="font-semibold text-gray-900 mb-2">Smart Resume Parsing</h3>
        <p class="text-sm text-gray-600">
          Upload your resume and our AI will automatically extract all your information
        </p>
      </div>

      <div class="bg-indigo-50 rounded-lg p-6">
        <div class="flex justify-center mb-4">
          <div class="rounded-full bg-indigo-100 p-3">
            <svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
        <h3 class="font-semibold text-gray-900 mb-2">Job Analysis</h3>
        <p class="text-sm text-gray-600">
          Analyze job descriptions to match your skills and experience
        </p>
      </div>

      <div class="bg-green-50 rounded-lg p-6">
        <div class="flex justify-center mb-4">
          <div class="rounded-full bg-green-100 p-3">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        </div>
        <h3 class="font-semibold text-gray-900 mb-2">Quick Apply</h3>
        <p class="text-sm text-gray-600">
          Use our Chrome extension to auto-fill applications in seconds
        </p>
      </div>
    </div>

    <!-- What's Next -->
    <div class="mt-12 bg-gray-50 rounded-lg p-6">
      <h3 class="font-semibold text-gray-900 mb-3">What's next?</h3>
      <ul class="text-left max-w-md mx-auto space-y-2">
        <li class="flex items-start">
          <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          <span class="text-sm text-gray-700">Complete your profile with contact information</span>
        </li>
        <li class="flex items-start">
          <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          <span class="text-sm text-gray-700">Upload your resume for automatic parsing (optional)</span>
        </li>
        <li class="flex items-start">
          <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          <span class="text-sm text-gray-700">Start applying to your dream jobs!</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WelcomeStep'
}
</script>
