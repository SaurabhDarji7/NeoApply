<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-3xl font-bold text-gray-900">Job Descriptions</h1>
          <BaseButton
            @click="showAddJobModal = true"
            variant="primary"
            aria-label="Add new job description"
          >
            <template #icon>
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </template>
            Add Job
          </BaseButton>
        </div>

        <!-- Search and Filter Bar -->
        <SearchFilterBar
          v-if="jobDescriptions.length > 0"
          v-model="searchQuery"
          v-model:selected-filter="selectedFilter"
          v-model:selected-sort="selectedSort"
          placeholder="Search jobs by title, company..."
          :filters="filterOptions"
          filter-label="Status"
          :sorts="sortOptions"
          :results-count="filteredJobs.length"
          aria-label="Search job descriptions"
        />
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
      <div v-else-if="filteredJobs.length > 0" class="space-y-4">
        <div
          v-for="job in filteredJobs"
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

          <!-- Error Message with Retry -->
          <div v-if="job.status === 'failed'" class="mt-4" @click.stop>
            <ErrorStateWithRetry
              title="Job parsing failed"
              :message="job.error_message || 'Failed to process this job description'"
              details="The job description could not be parsed. You can retry or manually enter the details."
              :show-retry="true"
              :alternative-action="{
                label: 'Edit Manually',
                onClick: () => handleEditManually(job.id)
              }"
              @retry="retryJob(job.id)"
            />
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
    <BaseModal
      v-model="showAddJobModal"
      title="Add Job Description"
      size="lg"
      @close="closeModal"
    >
      <form @submit.prevent="addJob">
        <!-- Tab Switcher for URL vs Text Input -->
        <TabSwitcher
          v-model="inputMethod"
          :tabs="[
            { value: 'url', label: 'From URL' },
            { value: 'text', label: 'Paste Text' }
          ]"
        >
          <!-- URL Tab -->
          <template #url>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Job Posting URL
                </label>
                <input
                  v-model="newJob.url"
                  type="url"
                  placeholder="https://www.linkedin.com/jobs/view/..."
                  class="input focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  :required="inputMethod === 'url'"
                  aria-describedby="url-help"
                />
                <p id="url-help" class="text-xs text-gray-500 mt-2">
                  Supported platforms: LinkedIn, Indeed, Greenhouse, Lever, and more
                </p>
              </div>

              <!-- Info Box -->
              <div class="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <div class="flex">
                  <svg class="h-5 w-5 text-blue-400 mr-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                  </svg>
                  <div class="text-sm text-blue-700">
                    <p class="font-medium mb-1">How it works:</p>
                    <p>We'll automatically extract the job title, company, description, requirements, and other details from the URL.</p>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Text Tab -->
          <template #text>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Job Description Text
                </label>
                <textarea
                  v-model="newJob.raw_text"
                  rows="10"
                  placeholder="Paste the complete job description here...

Include:
• Job title
• Company name
• Job responsibilities
• Required qualifications
• Preferred skills
• Salary range (if available)"
                  class="input focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  :required="inputMethod === 'text'"
                  aria-describedby="text-help"
                ></textarea>
                <p id="text-help" class="text-xs text-gray-500 mt-2">
                  Paste the full job description text. Our AI will parse and structure it.
                </p>
              </div>
            </div>
          </template>
        </TabSwitcher>

        <!-- Error Display -->
        <div v-if="submitError" class="mt-4">
          <ErrorStateWithRetry
            title="Failed to add job"
            :message="submitError"
            :show-retry="false"
            :dismissible="true"
            @dismiss="submitError = null"
          />
        </div>
      </form>

      <!-- Footer Actions -->
      <template #footer>
        <div class="flex gap-3 justify-end">
          <BaseButton
            variant="ghost"
            @click="closeModal"
          >
            Cancel
          </BaseButton>
          <BaseButton
            variant="primary"
            @click="addJob"
            :loading="submitting"
            loading-text="Adding job..."
            :disabled="inputMethod === 'url' ? !newJob.url : !newJob.raw_text"
          >
            Add Job
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useJobDescriptionStore } from '@/stores/jobDescription'
import { useToast } from '@/composables/useToast'
import LoadingStates from '@/components/common/LoadingStates.vue'
import ErrorDisplay from '@/components/common/ErrorDisplay.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import SearchFilterBar from '@/components/ui/SearchFilterBar.vue'
import TabSwitcher from '@/components/ui/TabSwitcher.vue'
import ErrorStateWithRetry from '@/components/ui/ErrorStateWithRetry.vue'

const jobDescriptionStore = useJobDescriptionStore()
const toast = useToast()

const jobDescriptions = ref([])
const loading = ref(false)
const error = ref(null)
const showAddJobModal = ref(false)
const submitting = ref(false)
const submitError = ref(null)
const inputMethod = ref('url')
const searchQuery = ref('')
const selectedFilter = ref('')
const selectedSort = ref('newest')

const newJob = ref({
  url: '',
  raw_text: ''
})

// Filter and Sort Options
const filterOptions = [
  { label: 'Processing', value: 'processing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' }
]

const sortOptions = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Title A-Z', value: 'title-asc' },
  { label: 'Company A-Z', value: 'company-asc' }
]

// Filtered and Sorted Jobs
const filteredJobs = computed(() => {
  let filtered = [...jobDescriptions.value]

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(job =>
      job.title?.toLowerCase().includes(query) ||
      job.company_name?.toLowerCase().includes(query)
    )
  }

  // Apply status filter
  if (selectedFilter.value) {
    if (selectedFilter.value === 'processing') {
      filtered = filtered.filter(job =>
        job.status === 'scraping' || job.status === 'parsing' || job.status === 'pending'
      )
    } else {
      filtered = filtered.filter(job => job.status === selectedFilter.value)
    }
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (selectedSort.value) {
      case 'newest':
        return new Date(b.created_at) - new Date(a.created_at)
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at)
      case 'title-asc':
        return (a.title || '').localeCompare(b.title || '')
      case 'company-asc':
        return (a.company_name || '').localeCompare(b.company_name || '')
      default:
        return 0
    }
  })

  return filtered
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
  if (inputMethod.value === 'url' && !newJob.value.url) {
    submitError.value = 'Please provide a job URL'
    return
  }

  if (inputMethod.value === 'text' && !newJob.value.raw_text) {
    submitError.value = 'Please paste the job description text'
    return
  }

  submitting.value = true
  submitError.value = null

  try {
    // Clear the field that's not being used
    if (inputMethod.value === 'url') {
      newJob.value.raw_text = ''
    } else {
      newJob.value.url = ''
    }

    await jobDescriptionStore.createJobDescription(newJob.value)

    toast.success(
      'Job added successfully!',
      'We\'re processing your job description. This may take 20-40 seconds.'
    )

    closeModal()
    jobDescriptions.value = jobDescriptionStore.jobDescriptions
  } catch (err) {
    submitError.value = err.response?.data?.error?.message || 'Failed to add job description'

    toast.error(
      'Failed to add job',
      submitError.value
    )
  } finally {
    submitting.value = false
  }
}

// Retry failed job
const retryJob = async (jobId) => {
  try {
    // This would call a retry endpoint on the backend
    await jobDescriptionStore.retryJobParsing(jobId)

    toast.success(
      'Retry initiated',
      'We\'re attempting to process this job again.'
    )
  } catch (err) {
    toast.error(
      'Retry failed',
      err.response?.data?.error?.message || 'Failed to retry job parsing'
    )
  }
}

// Handle edit manually
const handleEditManually = (jobId) => {
  // Navigate to edit page or open edit modal
  // For now, just navigate to the detail page
  window.location.href = `/jobs/${jobId}`
}

// Close modal
const closeModal = () => {
  showAddJobModal.value = false
  newJob.value = { url: '', raw_text: '' }
  submitError.value = null
  inputMethod.value = 'url'
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
