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

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <p class="text-sm text-gray-600 mb-1">Total Jobs</p>
          <p class="text-3xl font-bold text-gray-900">{{ jobDescriptions.length }}</p>
        </Card>
        <Card class="bg-blue-50">
          <p class="text-sm text-blue-600 mb-1">Processing</p>
          <p class="text-3xl font-bold text-blue-600">
            {{ jobDescriptionStore.statusCount('scraping') + jobDescriptionStore.statusCount('parsing') }}
          </p>
        </Card>
        <Card class="bg-green-50">
          <p class="text-sm text-green-600 mb-1">Completed</p>
          <p class="text-3xl font-bold text-green-600">{{ jobDescriptionStore.statusCount('completed') }}</p>
        </Card>
        <Card class="bg-red-50">
          <p class="text-sm text-red-600 mb-1">Failed</p>
          <p class="text-3xl font-bold text-red-600">{{ jobDescriptionStore.statusCount('failed') }}</p>
        </Card>
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
        <Card
          v-for="job in jobDescriptions"
          :key="job.id"
          hoverable
          clickable
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
                <span v-if="job.url"> • <a :href="job.url" target="_blank" class="text-primary-600 hover:underline" @click.stop>View Original</a></span>
              </p>
            </div>
            <StatusTag :variant="getStatusVariant(job.status)">
              {{ formatStatus(job.status) }}
            </StatusTag>
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
        </Card>
      </div>

      <!-- Empty State -->
      <EmptyState
        v-else
        title="No job descriptions yet"
        description="Add your first job description to get started with tailored cover letters."
        :action="true"
        action-label="Add Job Description"
        @action="showAddJobModal = true"
      >
        <template #icon>
          <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </template>
      </EmptyState>
    </div>

    <!-- Add Job Modal -->
    <Modal
      v-model="showAddJobModal"
      title="Add Job Description"
      size="lg"
      @close="closeModal"
    >
      <form @submit.prevent="addJob">
        <!-- URL Input -->
        <Input
          v-model="newJob.url"
          type="url"
          label="Job URL"
          placeholder="https://www.linkedin.com/jobs/view/..."
          hint="LinkedIn, Indeed, Greenhouse, etc."
          class="mb-4"
        />

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
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
          ></textarea>
        </div>

        <!-- Error Display -->
        <div v-if="submitError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
          {{ submitError }}
        </div>
      </form>

      <template #footer>
        <div class="flex gap-3 justify-end">
          <Button
            variant="secondary"
            @click="closeModal"
            :disabled="submitting"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            @click="addJob"
            :disabled="submitting || (!newJob.url && !newJob.raw_text)"
            :loading="submitting"
          >
            Add Job
          </Button>
        </div>
      </template>
    </Modal>

    <!-- FAB for Add Job -->
    <FAB
      aria-label="Add Job Description"
      @click="showAddJobModal = true"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useJobDescriptionStore } from '@/stores/jobDescription'
import LoadingStates from '@/components/common/LoadingStates.vue'
import ErrorDisplay from '@/components/common/ErrorDisplay.vue'
import { Card, Button, Modal, EmptyState, StatusTag, FAB, Input, useToast } from '@/components/common'

const toast = useToast()

const jobDescriptionStore = useJobDescriptionStore()

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
    toast.warning('Input required', submitError.value)
    return
  }

  submitting.value = true
  submitError.value = null

  try {
    await jobDescriptionStore.createJobDescription(newJob.value)
    toast.success('Job added successfully', 'The job description is being processed.')
    closeModal()
    jobDescriptions.value = jobDescriptionStore.jobDescriptions
  } catch (err) {
    const errorMessage = err.response?.data?.error?.message || 'Failed to add job description'
    submitError.value = errorMessage
    toast.error('Failed to add job', errorMessage)
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

// Status variant for StatusTag
const getStatusVariant = (status) => {
  const variants = {
    pending: 'warning',
    scraping: 'info',
    parsing: 'info',
    completed: 'success',
    failed: 'danger'
  }
  return variants[status] || 'neutral'
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
