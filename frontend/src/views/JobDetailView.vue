<template>
  <div class="job-detail-view container mx-auto px-4 py-8">
    <!-- Breadcrumb Navigation -->
    <div v-if="jobDescription" class="mb-6">
      <Breadcrumb
        :items="[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Jobs', path: '/jobs' },
          { label: jobDescription.title || 'Job Description' }
        ]"
        show-home
      />
    </div>

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
        <div class="flex justify-between items-start mb-4">
          <div class="flex-1 mr-4">
            <h1 class="text-3xl font-extrabold text-gray-900 mb-2">
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
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
          <BaseButton
            variant="danger"
            size="sm"
            @click="confirmDelete"
            aria-label="Delete job description"
          >
            Delete
          </BaseButton>
        </div>

        <!-- Status Badge -->
        <div class="mt-4">
          <BaseBadge :variant="getStatusVariant(jobDescription.status)" size="lg">
            {{ jobDescription.status.charAt(0).toUpperCase() + jobDescription.status.slice(1) }}
          </BaseBadge>
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
import { useToast } from '@/composables/useToast'
import ParsedJobDisplay from '@/components/job/ParsedJobDisplay.vue'
import LoadingStates from '@/components/common/LoadingStates.vue'
import ErrorDisplay from '@/components/common/ErrorDisplay.vue'
import Breadcrumb from '@/components/ui/Breadcrumb.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'

const route = useRoute()
const router = useRouter()
const jobDescriptionStore = useJobDescriptionStore()
const toast = useToast()

const jobDescription = ref(null)
const loading = ref(false)
const error = ref(null)
const showDeleteConfirm = ref(false)

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
  try {
    const jobTitle = jobDescription.value.title || 'Job description'
    await jobDescriptionStore.deleteJobDescription(jobDescription.value.id)

    toast.success(
      'Job deleted',
      `"${jobTitle}" has been permanently removed.`
    )

    router.push('/jobs')
  } catch (err) {
    console.error('Failed to delete job description:', err)
    toast.error(
      'Failed to delete job',
      'Please try again or contact support if the problem persists.'
    )
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

// Status variant mapping
const getStatusVariant = (status) => {
  const variants = {
    pending: 'warning',
    scraping: 'info',
    parsing: 'info',
    completed: 'success',
    failed: 'error'
  }
  return variants[status] || 'default'
}

// Confirm delete
const confirmDelete = () => {
  if (confirm(`Are you sure you want to delete "${jobDescription.value.title || 'this job'}"?`)) {
    deleteJobDescription()
  }
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
