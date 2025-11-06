<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-extrabold text-gray-900">My Resumes</h1>
          <p class="text-gray-600 mt-1">Upload and manage your resume files</p>
        </div>
        <BaseButton
          variant="primary"
          size="lg"
          @click="showUploadModal = true"
          aria-label="Upload new resume"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Upload Resume</span>
        </BaseButton>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <BaseCard hoverable>
          <p class="text-sm text-gray-600">Total</p>
          <p class="text-3xl font-bold text-gray-900">{{ resumes.length }}</p>
        </BaseCard>
        <BaseCard hoverable>
          <p class="text-sm text-gray-600">Parsed</p>
          <p class="text-3xl font-bold text-green-600">{{ resumeStore.statusCount('parsed') }}</p>
        </BaseCard>
        <BaseCard hoverable>
          <p class="text-sm text-gray-600">Processing</p>
          <p class="text-3xl font-bold text-blue-600">{{ resumeStore.statusCount('processing') }}</p>
        </BaseCard>
        <BaseCard hoverable>
          <p class="text-sm text-gray-600">Failed</p>
          <p class="text-3xl font-bold text-red-600">{{ resumeStore.statusCount('failed') }}</p>
        </BaseCard>
      </div>

      <!-- Search and Filter -->
      <div class="mb-6">
        <SearchFilterBar
          v-model="searchQuery"
          v-model:selected-filter="statusFilter"
          v-model:selected-sort="sortOption"
          placeholder="Search resumes by name..."
          aria-label="Search resumes"
          :filters="statusFilters"
          filter-label="Resumes"
          filter-aria-label="Filter by status"
          :sorts="sortOptions"
          sort-aria-label="Sort resumes"
          :results-count="filteredResumes.length"
        />
      </div>

      <!-- Resume List -->
      <BaseCard>
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-12">
          <SkeletonLoader type="table" :count="3" />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="py-12">
          <ErrorStateWithRetry
            :error-message="error"
            @retry="loadResumes"
          />
        </div>

        <!-- Empty State -->
        <div v-else-if="resumes.length === 0">
          <EmptyState
            type="document"
            title="No resumes uploaded yet"
            description="Upload your first resume to get started with tailored job applications."
            action-label="Upload Your First Resume"
            @action="showUploadModal = true"
          />
        </div>

        <!-- No Results State -->
        <div v-else-if="filteredResumes.length === 0">
          <EmptyState
            type="search"
            title="No resumes found"
            description="Try adjusting your search or filter criteria."
            action-label="Clear Filters"
            @action="clearFilters"
          />
        </div>

        <!-- Table -->
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Info
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="resume in filteredResumes" :key="resume.id" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4">
                  <router-link
                    :to="`/resumes/${resume.id}`"
                    class="text-primary hover:text-blue-700 font-medium focus:outline-none focus:underline"
                  >
                    {{ resume.name }}
                  </router-link>
                </td>
                <td class="px-6 py-4">
                  <BaseBadge :variant="getStatusVariant(resume.status)">
                    {{ resume.status }}
                  </BaseBadge>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  <div v-if="resume.file">
                    <p class="font-medium">{{ resume.file.filename }}</p>
                    <p class="text-xs text-gray-500">{{ formatFileSize(resume.file.byte_size) }}</p>
                  </div>
                  <p v-else class="text-gray-400 italic">No file</p>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  {{ formatDate(resume.created_at) }}
                </td>
                <td class="px-6 py-4 text-right text-sm space-x-2">
                  <router-link
                    :to="`/resumes/${resume.id}`"
                    class="text-primary hover:text-blue-700 font-medium focus:outline-none focus:underline"
                    aria-label="`View ${resume.name}`"
                  >
                    View
                  </router-link>
                  <button
                    v-if="resume.file"
                    @click="handleDownload(resume)"
                    class="text-green-600 hover:text-green-800 font-medium focus:outline-none focus:underline"
                    :aria-label="`Download ${resume.name}`"
                  >
                    Download
                  </button>
                  <button
                    @click="confirmDelete(resume)"
                    class="text-red-600 hover:text-red-800 font-medium focus:outline-none focus:underline"
                    :aria-label="`Delete ${resume.name}`"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BaseCard>
    </div>

    <!-- Upload Modal -->
    <BaseModal
      v-model="showUploadModal"
      title="Upload Resume"
      size="lg"
      @close="closeUploadModal"
    >
      <form @submit.prevent="handleUpload">
        <div class="mb-6">
          <label for="resume-name" class="block text-sm font-medium text-gray-700 mb-2">
            Resume Name <span class="text-red-500">*</span>
          </label>
          <input
            id="resume-name"
            v-model="uploadForm.name"
            type="text"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Software Engineer Resume 2024"
            aria-required="true"
          />
        </div>

        <div class="mb-6">
          <FileUpload
            ref="fileUploadRef"
            @file-selected="handleFileSelected"
            @file-cleared="uploadForm.file = null"
          />
          <p class="mt-2 text-sm text-gray-500">
            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Supported formats: PDF, DOCX, TXT • Max size: 10MB
          </p>
        </div>

        <div v-if="uploadError" class="mb-6 rounded-md bg-red-50 p-4 border border-red-200" role="alert">
          <div class="flex">
            <svg class="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <p class="text-sm text-red-800">{{ uploadError }}</p>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end space-x-3">
            <BaseButton
              type="button"
              variant="ghost"
              @click="closeUploadModal"
              :disabled="uploading"
            >
              Cancel
            </BaseButton>
            <BaseButton
              type="submit"
              variant="primary"
              :loading="uploading"
              loading-text="Uploading..."
              :disabled="!uploadForm.file"
            >
              Upload Resume
            </BaseButton>
          </div>
        </template>
      </form>
    </BaseModal>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      type="danger"
      title="Delete Resume"
      :message="`Are you sure you want to delete &quot;${resumeToDelete?.name}&quot;?`"
      confirm-text="Delete"
      cancel-text="Cancel"
      :loading="deleting"
      @confirm="handleDelete"
      @cancel="cancelDelete"
    >
      <p class="text-sm text-gray-600">
        This action cannot be undone. The resume and all associated data will be permanently removed.
      </p>
    </ConfirmDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useResumeStore } from '@/stores/resume'
import { useToast } from '@/composables/useToast'
import resumeService from '@/services/resumeService'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import ErrorStateWithRetry from '@/components/ui/ErrorStateWithRetry.vue'
import SearchFilterBar from '@/components/ui/SearchFilterBar.vue'
import FileUpload from '@/components/common/FileUpload.vue'

const resumeStore = useResumeStore()
const toast = useToast()

// State
const showUploadModal = ref(false)
const showDeleteDialog = ref(false)
const uploadForm = ref({
  name: '',
  file: null
})
const uploadError = ref(null)
const uploading = ref(false)
const deleting = ref(false)
const fileUploadRef = ref(null)
const resumeToDelete = ref(null)

// Search and Filter State
const searchQuery = ref('')
const statusFilter = ref('')
const sortOption = ref('newest')

// Filter Options
const statusFilters = [
  { label: 'Processing', value: 'processing' },
  { label: 'Parsed', value: 'parsed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Pending', value: 'pending' }
]

const sortOptions = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Name (A-Z)', value: 'name-asc' },
  { label: 'Name (Z-A)', value: 'name-desc' }
]

// Computed
const resumes = computed(() => resumeStore.resumes)
const loading = computed(() => resumeStore.loading)
const error = computed(() => resumeStore.error)

const filteredResumes = computed(() => {
  let result = [...resumes.value]

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(resume =>
      resume.name.toLowerCase().includes(query) ||
      resume.file?.filename?.toLowerCase().includes(query)
    )
  }

  // Apply status filter
  if (statusFilter.value) {
    result = result.filter(resume => resume.status === statusFilter.value)
  }

  // Apply sorting
  result.sort((a, b) => {
    switch (sortOption.value) {
      case 'newest':
        return new Date(b.created_at) - new Date(a.created_at)
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at)
      case 'name-asc':
        return a.name.localeCompare(b.name)
      case 'name-desc':
        return b.name.localeCompare(a.name)
      default:
        return 0
    }
  })

  return result
})

// Lifecycle
onMounted(() => {
  loadResumes()
})

// Methods
const loadResumes = async () => {
  try {
    await resumeStore.fetchResumes()
  } catch (err) {
    console.error('Failed to load resumes:', err)
    toast.error(
      'Failed to load resumes',
      'Please try again or contact support if the problem persists.'
    )
  }
}

const handleFileSelected = (file) => {
  uploadForm.value.file = file
  uploadError.value = null

  // Auto-populate name from filename if empty
  if (!uploadForm.value.name) {
    uploadForm.value.name = file.name.replace(/\.[^/.]+$/, '')
  }
}

const handleUpload = async () => {
  if (!uploadForm.value.file) {
    uploadError.value = 'Please select a file to upload'
    return
  }

  uploading.value = true
  uploadError.value = null

  try {
    await resumeStore.uploadResume(uploadForm.value.file, uploadForm.value.name)

    toast.success(
      'Resume uploaded successfully!',
      'Your resume is being parsed. This usually takes 20-40 seconds.',
      {
        duration: 5000
      }
    )

    closeUploadModal()
  } catch (err) {
    console.error('Upload failed:', err)

    // Provide specific error messages
    const errorMessage = err.response?.data?.error?.message
    if (errorMessage?.includes('size')) {
      uploadError.value = 'File size exceeds 10MB limit. Please compress your file and try again.'
    } else if (errorMessage?.includes('format') || errorMessage?.includes('type')) {
      uploadError.value = 'Invalid file format. Please use PDF, DOCX, or TXT files only.'
    } else {
      uploadError.value = errorMessage || 'Failed to upload resume. Please try again.'
    }

    toast.error(
      'Upload failed',
      uploadError.value
    )
  } finally {
    uploading.value = false
  }
}

const closeUploadModal = () => {
  showUploadModal.value = false
  uploadForm.value = { name: '', file: null }
  uploadError.value = null
  if (fileUploadRef.value) {
    fileUploadRef.value.clearFile()
  }
}

const confirmDelete = (resume) => {
  resumeToDelete.value = resume
  showDeleteDialog.value = true
}

const cancelDelete = () => {
  resumeToDelete.value = null
  showDeleteDialog.value = false
}

const handleDelete = async () => {
  if (!resumeToDelete.value) return

  deleting.value = true

  try {
    await resumeStore.deleteResume(resumeToDelete.value.id)

    toast.success(
      'Resume deleted',
      `"${resumeToDelete.value.name}" has been permanently removed.`
    )

    showDeleteDialog.value = false
    resumeToDelete.value = null
  } catch (err) {
    console.error('Delete failed:', err)
    toast.error(
      'Failed to delete resume',
      'Please try again or contact support if the problem persists.'
    )
  } finally {
    deleting.value = false
  }
}

const handleDownload = (resume) => {
  try {
    const url = getDownloadUrl(resume.id)
    window.open(url, '_blank')

    toast.success(
      'Download started',
      `Downloading ${resume.file.filename}`
    )
  } catch (err) {
    console.error('Download failed:', err)
    toast.error(
      'Download failed',
      'Please try again or contact support.'
    )
  }
}

const getDownloadUrl = (id) => {
  return resumeService.getDownloadUrl(id)
}

const getStatusVariant = (status) => {
  const variants = {
    pending: 'warning',
    processing: 'info',
    parsed: 'success',
    failed: 'error'
  }
  return variants[status] || 'default'
}

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = (now - date) / (1000 * 60 * 60)

  // Show relative time if less than 24 hours
  if (diffInHours < 24) {
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60)
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
    }
    const hours = Math.floor(diffInHours)
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  }

  // Show absolute date for older items
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatFileSize = (bytes) => {
  if (!bytes) return 'N/A'
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
</script>
