<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Job Descriptions</h1>
        <button
          @click="showAddJobModal = true"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          + Add Job
        </button>
      </div>

      <!-- Resume Required Warning -->
      <div v-if="!hasUploadedResume" class="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div class="flex items-start">
          <svg class="w-6 h-6 text-yellow-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-medium text-yellow-800">Resume Upload Recommended</p>
            <p class="text-sm text-yellow-700 mt-1">
              To get the most out of job descriptions, we recommend uploading your resume first.
              <router-link to="/resumes" class="underline font-medium hover:text-yellow-900">
                Upload Resume
              </router-link>
            </p>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-sm text-gray-600 mb-1">Total Jobs</p>
          <p class="text-3xl font-bold text-gray-900">{{ jobDescriptions.length }}</p>
        </div>
        <div class="bg-blue-50 rounded-lg shadow p-6">
          <p class="text-sm text-blue-600 mb-1">Processing</p>
          <p class="text-3xl font-bold text-blue-600">
            {{ jobDescriptionStore.statusCount('scraping') + jobDescriptionStore.statusCount('parsing') }}
          </p>
        </div>
        <div class="bg-green-50 rounded-lg shadow p-6">
          <p class="text-sm text-green-600 mb-1">Completed</p>
          <p class="text-3xl font-bold text-green-600">{{ jobDescriptionStore.statusCount('completed') }}</p>
        </div>
        <div class="bg-red-50 rounded-lg shadow p-6">
          <p class="text-sm text-red-600 mb-1">Failed</p>
          <p class="text-3xl font-bold text-red-600">{{ jobDescriptionStore.statusCount('failed') }}</p>
        </div>
      </div>

      <!-- Loading State -->
      <LoadingStates v-if="loading && jobDescriptions.length === 0" type="skeleton" />

      <!-- Error State -->
      <ErrorDisplay
        v-else-if="error"
        :title="'Failed to load jobs'"
        :message="error"
        :show-retry="true"
        @retry="loadJobs"
      />

      <!-- Job List -->
      <div v-else-if="jobDescriptions.length > 0" class="space-y-4">
        <div
          v-for="job in jobDescriptions"
          :key="job.id"
          class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer"
          @click="$router.push(`/jobs/${job.id}`)"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <h3 class="text-xl font-semibold text-gray-900 mb-2">
                {{ job.title || 'Job Title' }}
              </h3>
              <p class="text-gray-700 mb-2">{{ job.company_name || 'Company' }}</p>
              <p class="text-sm text-gray-600">
                Added {{ formatDate(job.created_at) }}
                <span v-if="job.url"> • <a :href="job.url" target="_blank" class="text-blue-600 hover:underline" @click.stop>View Original</a></span>
              </p>
            </div>
            <span
              :class="[
                'px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap',
                statusColor(job.status)
              ]"
            >
              {{ formatStatus(job.status) }}
            </span>
          </div>

          <!-- Error Message -->
          <div v-if="job.status === 'failed' && job.error_message" class="mt-4 text-sm text-red-600">
            Error: {{ job.error_message }}
          </div>

          <!-- Quick Info for Completed Jobs -->
          <div v-if="job.status === 'completed' && job.parsed_attributes" class="mt-4 flex flex-wrap gap-4 text-sm">
            <span v-if="job.parsed_attributes.remote_type" class="text-gray-600">
              🏠 {{ job.parsed_attributes.remote_type }}
            </span>
            <span v-if="job.parsed_attributes.job_type" class="text-gray-600">
              💼 {{ job.parsed_attributes.job_type }}
            </span>
            <span v-if="job.parsed_attributes.experience_level" class="text-gray-600">
              📊 {{ job.parsed_attributes.experience_level }}
            </span>
            <span v-if="job.parsed_attributes.salary_range" class="text-green-600 font-medium">
              💰 {{ formatSalaryBrief(job.parsed_attributes.salary_range) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="bg-white rounded-lg shadow p-12 text-center">
        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No job descriptions yet</h3>
        <p class="text-gray-600 mb-4">Add your first job description to get started</p>
        <button
          @click="showAddJobModal = true"
          class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Add Job Description
        </button>
      </div>
    </div>

    <!-- Add Job Modal -->
    <div v-if="showAddJobModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="closeModal">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-900">Add Job Description</h2>
            <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="addJob">
            <!-- URL Input -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Job URL</label>
              <input
                v-model="newJob.url"
                type="url"
                placeholder="https://www.linkedin.com/jobs/view/..."
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p class="text-xs text-gray-500 mt-1">LinkedIn, Indeed, Greenhouse, etc.</p>
            </div>

            <!-- Divider -->
            <div class="flex items-center my-6">
              <div class="flex-1 border-t border-gray-300"></div>
              <span class="px-4 text-sm text-gray-500">OR</span>
              <div class="flex-1 border-t border-gray-300"></div>
            </div>

            <!-- Raw Text Input -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Paste Job Description</label>
              <textarea
                v-model="newJob.raw_text"
                rows="8"
                placeholder="Paste the job description text here..."
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              ></textarea>
            </div>

            <!-- Error Display -->
            <div v-if="submitError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
              {{ submitError }}
            </div>

            <!-- Buttons -->
            <div class="flex gap-3">
              <button
                type="submit"
                :disabled="submitting || (!newJob.url && !newJob.raw_text)"
                class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ submitting ? 'Adding...' : 'Add Job' }}
              </button>
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useJobDescriptionStore } from '@/stores/jobDescription'
import { useAuthStore } from '@/stores/auth'
import LoadingStates from '@/components/common/LoadingStates.vue'
import ErrorDisplay from '@/components/common/ErrorDisplay.vue'

const jobDescriptionStore = useJobDescriptionStore()
const authStore = useAuthStore()

const hasUploadedResume = computed(() => authStore.hasUploadedResume)

const jobDescriptions = ref([])
const loading = ref(false)
const error = ref(null)
const showAddJobModal = ref(false)
const submitting = ref(false)
const submitError = ref(null)

const newJob = ref({
  url: '',
  raw_text: ''
})

// Load jobs
const loadJobs = async () => {
  loading.value = true
  error.value = null

  try {
    await jobDescriptionStore.fetchJobDescriptions()
    jobDescriptions.value = jobDescriptionStore.jobDescriptions
  } catch (err) {
    error.value = err.message || 'Failed to load job descriptions'
  } finally {
    loading.value = false
  }
}

// Add job
const addJob = async () => {
  if (!newJob.value.url && !newJob.value.raw_text) {
    submitError.value = 'Please provide either a URL or paste the job description text'
    return
  }

  submitting.value = true
  submitError.value = null

  try {
    await jobDescriptionStore.createJobDescription(newJob.value)
    closeModal()
    jobDescriptions.value = jobDescriptionStore.jobDescriptions
  } catch (err) {
    submitError.value = err.response?.data?.error?.message || 'Failed to add job description'
  } finally {
    submitting.value = false
  }
}

// Close modal
const closeModal = () => {
  showAddJobModal.value = false
  newJob.value = { url: '', raw_text: '' }
  submitError.value = null
}

// Format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
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

// Format status
const formatStatus = (status) => {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

// Format salary brief
const formatSalaryBrief = (salaryRange) => {
  if (!salaryRange || (!salaryRange.min && !salaryRange.max)) return ''

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: salaryRange.currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: 'compact'
  })

  if (salaryRange.min && salaryRange.max) {
    return `${formatter.format(salaryRange.min)}-${formatter.format(salaryRange.max)}`
  } else if (salaryRange.min) {
    return `${formatter.format(salaryRange.min)}+`
  }
  return ''
}

// Watch store for updates
const unwatchStore = jobDescriptionStore.$subscribe((mutation, state) => {
  jobDescriptions.value = state.jobDescriptions
})

onMounted(async () => {
  try {
    await loadJobs()
  } catch (error) {
    console.error('Failed to load jobs:', error)
    loading.value = false
    error.value = error.message || 'Failed to load jobs'
  }
})

onUnmounted(() => {
  // Stop all polling when leaving page
  try {
    jobDescriptionStore.stopAllPolling()
  } catch (err) {
    console.warn('Error stopping polling:', err)
  }
  unwatchStore()
})
</script>

<style scoped>
/* Add any custom styles here */
</style>
