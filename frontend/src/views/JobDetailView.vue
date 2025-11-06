<template>
  <div class="job-detail-view container mx-auto px-4 py-8">
    <!-- Back Button -->
    <button
      @click="$router.back()"
      class="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back to Jobs
    </button>

    <!-- Loading State -->
    <LoadingStates
      v-if="loading && !jobDescription"
      type="skeleton"
    />

    <!-- Error State -->
    <ErrorDisplay
      v-else-if="error"
      :title="'Failed to load job description'"
      :message="error"
      :show-retry="true"
      @retry="loadJobDescription"
    />

    <!-- Job Description Content -->
    <div v-else-if="jobDescription">
      <!-- Job Header -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <div class="flex justify-between items-start">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">
              {{ jobDescription.title || 'Job Description' }}
            </h1>
            <p class="text-lg text-gray-700 mb-2">
              {{ jobDescription.company_name || 'Company' }}
            </p>
            <div class="flex items-center gap-4 text-sm text-gray-600">
              <span>Added {{ formatDate(jobDescription.created_at) }}</span>
              <a
                v-if="jobDescription.url"
                :href="jobDescription.url"
                target="_blank"
                class="text-blue-600 hover:underline flex items-center gap-1"
              >
                View Original
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
          <button
            @click="deleteJobDescription"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Delete
          </button>
        </div>

        <!-- Status Badge -->
        <div class="mt-4">
          <span
            :class="[
              'px-3 py-1 rounded-full text-sm font-medium',
              statusColor(jobDescription.status)
            ]"
          >
            {{ jobDescription.status.charAt(0).toUpperCase() + jobDescription.status.slice(1) }}
          </span>
        </div>
      </div>

      <!-- Scraping Status -->
      <LoadingStates
        v-if="jobDescription.status === 'scraping'"
        type="scraping"
        title="Scraping job description..."
        message="Fetching job information from the URL. This usually takes 5-15 seconds."
      />

      <!-- Parsing Status -->
      <LoadingStates
        v-else-if="jobDescription.status === 'parsing'"
        type="parsing"
        title="Parsing job description..."
        message="Analyzing job requirements and extracting key information."
      />

      <!-- Failed Status -->
      <ErrorDisplay
        v-else-if="jobDescription.status === 'failed'"
        :title="'Job description processing failed'"
        :message="jobDescription.error_message || 'An unknown error occurred during processing'"
        :show-retry="true"
        :suggestions="[
          'Make sure the URL is accessible and valid',
          'Check that the job posting is still available',
          'Try pasting the job description text manually instead'
        ]"
        @retry="retryProcessing"
      />

      <!-- Parsed Job Display -->
      <ParsedJobDisplay
        v-else-if="jobDescription.status === 'completed' && jobDescription.parsed_attributes"
        :attributes="jobDescription.parsed_attributes"
      />

      <!-- No Data -->
      <div v-else class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-500">Job description data not available</p>
      </div>
    </div>

    <!-- Not Found -->
    <div v-else class="bg-white rounded-lg shadow p-6">
      <p class="text-gray-500">Job description not found</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useJobDescriptionStore } from '@/stores/jobDescription'
import ParsedJobDisplay from '@/components/job/ParsedJobDisplay.vue'
import LoadingStates from '@/components/common/LoadingStates.vue'
import ErrorDisplay from '@/components/common/ErrorDisplay.vue'

const route = useRoute()
const router = useRouter()
const jobDescriptionStore = useJobDescriptionStore()

const jobDescription = ref(null)
const loading = ref(false)
const error = ref(null)

// Load job description data
const loadJobDescription = async () => {
  loading.value = true
  error.value = null

  try {
    await jobDescriptionStore.fetchJobDescription(route.params.id)
    jobDescription.value = jobDescriptionStore.currentJobDescription

    // Start polling if still processing
    if (jobDescription.value && ['pending', 'scraping', 'parsing'].includes(jobDescription.value.status)) {
      jobDescriptionStore.pollJobStatus(jobDescription.value.id)
    }
  } catch (err) {
    error.value = err.response?.data?.error?.message || 'Failed to load job description'
  } finally {
    loading.value = false
  }
}

// Delete job description
const deleteJobDescription = async () => {
  if (!confirm('Are you sure you want to delete this job description?')) {
    return
  }

  try {
    await jobDescriptionStore.deleteJobDescription(jobDescription.value.id)
    router.push('/jobs')
  } catch (err) {
    error.value = 'Failed to delete job description'
  }
}

// Retry processing (placeholder - would need backend endpoint)
const retryProcessing = () => {
  alert('Retry functionality coming soon!')
}

// Format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Status color
const statusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    scraping: 'bg-purple-100 text-purple-800',
    parsing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

// Watch for updates from store
const unwatchStore = jobDescriptionStore.$subscribe((mutation, state) => {
  if (state.currentJobDescription && state.currentJobDescription.id === parseInt(route.params.id)) {
    jobDescription.value = state.currentJobDescription
  }
})

onMounted(async () => {
  try {
    await loadJobDescription()
  } catch (err) {
    console.error('Failed to load job description:', err)
    loading.value = false
    error.value = err.message || 'Failed to load job description'
  }
})

onUnmounted(() => {
  // Stop polling when leaving the page
  try {
    if (jobDescription.value) {
      jobDescriptionStore.stopPolling(jobDescription.value.id)
    }
  } catch (err) {
    console.warn('Error stopping polling:', err)
  }
  unwatchStore()
})
</script>

<style scoped>
/* Add any custom styles here */
</style>
