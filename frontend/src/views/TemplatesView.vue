<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-extrabold text-gray-900">Resume Templates</h1>
          <p class="text-gray-600 mt-1">Create and manage document templates with dynamic placeholders</p>
        </div>
        <BaseButton
          variant="primary"
          size="lg"
          @click="showUploadModal = true"
          aria-label="Create new template"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Create New Template</span>
        </BaseButton>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <BaseCard hoverable>
          <p class="text-sm text-gray-600">Total</p>
          <p class="text-3xl font-bold text-gray-900">{{ templates.length }}</p>
        </BaseCard>
        <BaseCard hoverable>
          <p class="text-sm text-gray-600">Completed</p>
          <p class="text-3xl font-bold text-green-600">{{ completedCount }}</p>
        </BaseCard>
        <BaseCard hoverable>
          <p class="text-sm text-gray-600">Parsing</p>
          <p class="text-3xl font-bold text-blue-600">{{ parsingCount }}</p>
        </BaseCard>
        <BaseCard hoverable>
          <p class="text-sm text-gray-600">Failed</p>
          <p class="text-3xl font-bold text-red-600">{{ failedCount }}</p>
        </BaseCard>
      </div>

      <!-- Search and Filter -->
      <div class="mb-6">
        <SearchFilterBar
          v-model="searchQuery"
          v-model:selected-filter="statusFilter"
          v-model:selected-sort="sortOption"
          placeholder="Search templates by name..."
          aria-label="Search templates"
          :filters="statusFilters"
          filter-label="Templates"
          filter-aria-label="Filter by status"
          :sorts="sortOptions"
          sort-aria-label="Sort templates"
          :results-count="filteredTemplates.length"
        />
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-12">
        <SkeletonLoader type="card" :count="3" />
      </div>

      <!-- Empty State -->
      <div v-else-if="templates.length === 0">
        <EmptyState
          type="document"
          title="No templates yet"
          description="Create your first template to generate tailored resumes for different job applications."
          action-label="Create Your First Template"
          @action="showUploadModal = true"
        />
      </div>

      <!-- No Results State -->
      <div v-else-if="filteredTemplates.length === 0">
        <EmptyState
          type="search"
          title="No templates found"
          description="Try adjusting your search or filter criteria."
          action-label="Clear Filters"
          @action="clearFilters"
        />
      </div>

      <!-- Templates Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <BaseCard
          v-for="template in filteredTemplates"
          :key="template.id"
          hoverable
          class="cursor-pointer transition-all"
          @click="viewTemplate(template)"
        >
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-xl font-semibold text-gray-900 flex-1 mr-2">{{ template.name }}</h3>
            <BaseBadge :variant="getStatusVariant(template.status)">
              {{ formatStatus(template.status) }}
            </BaseBadge>
          </div>

          <div class="space-y-2 text-sm text-gray-600 mb-4">
            <div class="flex items-center">
              <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span v-if="template.file">{{ template.file.filename }}</span>
              <span v-else class="italic">Text Input</span>
            </div>
            <div class="flex items-center">
              <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{{ formatDate(template.created_at) }}</span>
            </div>
            <div v-if="template.attempt_count > 0" class="flex items-center">
              <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{{ template.attempt_count }} parse {{ template.attempt_count === 1 ? 'attempt' : 'attempts' }}</span>
            </div>
          </div>

          <div v-if="template.error_message" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p class="text-xs text-red-800">{{ template.error_message }}</p>
          </div>

          <div class="flex flex-wrap gap-2" @click.stop>
            <BaseButton
              v-if="template.status === 'failed'"
              variant="outline"
              size="sm"
              @click="retryParsing(template)"
              aria-label="`Retry parsing ${template.name}`"
            >
              Retry
            </BaseButton>
            <BaseButton
              v-if="template.status === 'completed' && template.file"
              variant="outline"
              size="sm"
              @click="downloadTemplate(template)"
              aria-label="`Download ${template.name}`"
            >
              Download
            </BaseButton>
            <BaseButton
              v-if="template.status === 'completed'"
              variant="primary"
              size="sm"
              @click="applyJobToTemplate(template)"
              aria-label="`Apply job to ${template.name}`"
            >
              Apply Job
            </BaseButton>
            <BaseButton
              variant="danger"
              size="sm"
              @click="confirmDelete(template)"
              aria-label="`Delete ${template.name}`"
            >
              Delete
            </BaseButton>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Upload Modal -->
    <BaseModal
      v-model="showUploadModal"
      title="Create New Template"
      size="lg"
      @close="closeModal"
    >
      <form @submit.prevent="createTemplate">
        <!-- Input Mode Tabs -->
        <div class="mb-6">
          <TabSwitcher
            v-model="inputMode"
            :tabs="inputModeTabs"
            aria-label="Choose input method"
          />
        </div>

        <div class="mb-6">
          <label for="template-name" class="block text-sm font-medium text-gray-700 mb-2">
            Template Name <span class="text-red-500">*</span>
          </label>
          <input
            id="template-name"
            v-model="newTemplate.name"
            type="text"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., My Resume 2024"
            aria-required="true"
          />
        </div>

        <!-- File Input -->
        <div v-if="inputMode === 'file'" class="mb-6">
          <label for="template-file" class="block text-sm font-medium text-gray-700 mb-2">
            Upload .docx File <span class="text-red-500">*</span>
          </label>
          <input
            id="template-file"
            ref="fileInputRef"
            type="file"
            accept=".docx"
            @change="handleFileUpload"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p class="mt-2 text-sm text-gray-500">
            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Only .docx files under 10MB are allowed. Use placeholders like {{company_name}}.
          </p>
        </div>

        <!-- Text Input -->
        <div v-else class="mb-6">
          <label for="template-text" class="block text-sm font-medium text-gray-700 mb-2">
            Paste Resume Text <span class="text-red-500">*</span>
          </label>
          <textarea
            id="template-text"
            v-model="newTemplate.content_text"
            rows="10"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder="Paste your resume text here... Use {{company_name}}, {{title}}, etc. as placeholders."
            aria-required="true"
          />
          <p class="mt-2 text-sm text-gray-500">
            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Use double curly braces for dynamic fields: {{company_name}}, {{title}}, {{skills_required}}
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
              @click="closeModal"
              :disabled="uploading"
            >
              Cancel
            </BaseButton>
            <BaseButton
              type="submit"
              variant="primary"
              :loading="uploading"
              loading-text="Creating..."
            >
              Create Template
            </BaseButton>
          </div>
        </template>
      </form>
    </BaseModal>

    <!-- Apply Job Modal -->
    <BaseModal
      v-model="showApplyJobModal"
      title="Apply Job Description"
      size="lg"
      @close="closeApplyJobModal"
    >
      <div class="mb-6">
        <label for="job-select" class="block text-sm font-medium text-gray-700 mb-2">
          Select Job Description <span class="text-red-500">*</span>
        </label>
        <select
          id="job-select"
          v-model="selectedJobId"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- Select a job --</option>
          <option
            v-for="job in completedJobs"
            :key="job.id"
            :value="job.id"
          >
            {{ job.title }} at {{ job.company_name }}
          </option>
        </select>
      </div>

      <div v-if="selectedJobId" class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">Available Tokens:</h3>
        <div class="flex flex-wrap gap-2">
          <code
            v-for="token in availableTokens"
            :key="token"
            class="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono"
          >
            {{ tokenDisplay(token) }}
          </code>
        </div>
        <p class="mt-3 text-xs text-gray-600">
          These tokens in your template will be replaced with actual job data.
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <BaseButton
            variant="ghost"
            @click="closeApplyJobModal"
            :disabled="applying"
          >
            Cancel
          </BaseButton>
          <BaseButton
            variant="primary"
            :loading="applying"
            loading-text="Applying..."
            :disabled="!selectedJobId"
            @click="submitApplyJob"
          >
            Apply & Download
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Template Editor Modal -->
    <TemplateEditor
      v-if="showEditorModal && selectedTemplate"
      :template-id="selectedTemplate.id"
      @close="closeEditorModal"
    />

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      type="danger"
      title="Delete Template"
      :message="`Are you sure you want to delete &quot;${templateToDelete?.name}&quot;?`"
      confirm-text="Delete"
      cancel-text="Cancel"
      :loading="deleting"
      @confirm="handleDelete"
      @cancel="cancelDelete"
    >
      <p class="text-sm text-gray-600">
        This action cannot be undone. The template and all associated data will be permanently removed.
      </p>
    </ConfirmDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import api from '@/services/api'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import SearchFilterBar from '@/components/ui/SearchFilterBar.vue'
import TabSwitcher from '@/components/ui/TabSwitcher.vue'
import TemplateEditor from '@/components/template/TemplateEditor.vue'

const toast = useToast()

// State
const templates = ref([])
const loading = ref(true)
const showUploadModal = ref(false)
const showApplyJobModal = ref(false)
const showEditorModal = ref(false)
const showDeleteDialog = ref(false)
const inputMode = ref('file')
const uploading = ref(false)
const applying = ref(false)
const deleting = ref(false)
const uploadError = ref('')
const selectedTemplate = ref(null)
const selectedJobId = ref('')
const completedJobs = ref([])
const templateToDelete = ref(null)
const fileInputRef = ref(null)

const newTemplate = ref({
  name: '',
  content_text: '',
  file: null
})

// Search and Filter State
const searchQuery = ref('')
const statusFilter = ref('')
const sortOption = ref('newest')

// Tab Options
const inputModeTabs = [
  {
    label: 'Upload .docx File',
    value: 'file',
    icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'
  },
  {
    label: 'Paste Text',
    value: 'text',
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
  }
]

// Filter Options
const statusFilters = [
  { label: 'Completed', value: 'completed' },
  { label: 'Parsing', value: 'parsing' },
  { label: 'Failed', value: 'failed' },
  { label: 'Pending', value: 'pending' }
]

const sortOptions = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Name (A-Z)', value: 'name-asc' },
  { label: 'Name (Z-A)', value: 'name-desc' }
]

const availableTokens = [
  'company_name',
  'title',
  'job_location',
  'job_type',
  'experience_level',
  'top_5_skills_needed',
  'skills_required',
  'responsibilities',
  'qualifications',
  'salary_range'
]

// Computed
const completedCount = computed(() => templates.value.filter(t => t.status === 'completed').length)
const parsingCount = computed(() => templates.value.filter(t => t.status === 'parsing').length)
const failedCount = computed(() => templates.value.filter(t => t.status === 'failed').length)

const filteredTemplates = computed(() => {
  let result = [...templates.value]

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(template =>
      template.name.toLowerCase().includes(query) ||
      template.file?.filename?.toLowerCase().includes(query)
    )
  }

  // Apply status filter
  if (statusFilter.value) {
    result = result.filter(template => template.status === statusFilter.value)
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
  fetchTemplates()
})

// Methods
const fetchTemplates = async () => {
  try {
    loading.value = true
    const response = await api.get('/templates')
    templates.value = response.data.data
  } catch (error) {
    console.error('Failed to fetch templates:', error)
    toast.error(
      'Failed to load templates',
      'Please try again or contact support if the problem persists.'
    )
  } finally {
    loading.value = false
  }
}

const fetchCompletedJobs = async () => {
  try {
    const response = await api.get('/job_descriptions?status=completed')
    completedJobs.value = response.data.data
  } catch (error) {
    console.error('Failed to fetch jobs:', error)
    toast.error('Failed to load jobs', 'Unable to fetch completed job descriptions.')
  }
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    newTemplate.value.file = file
    uploadError.value = ''
  }
}

const createTemplate = async () => {
  try {
    uploading.value = true
    uploadError.value = ''

    const formData = new FormData()
    formData.append('template[name]', newTemplate.value.name)

    if (inputMode.value === 'file') {
      if (!newTemplate.value.file) {
        uploadError.value = 'Please select a file'
        return
      }
      formData.append('template[file]', newTemplate.value.file)
    } else {
      if (!newTemplate.value.content_text) {
        uploadError.value = 'Please enter resume text'
        return
      }
      formData.append('template[content_text]', newTemplate.value.content_text)
    }

    await api.post('/templates', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    toast.success(
      'Template created successfully!',
      'Your template is being parsed and will be ready shortly.',
      { duration: 5000 }
    )

    closeModal()
    fetchTemplates()
  } catch (error) {
    console.error('Template creation failed:', error)

    const errorMessage = error.response?.data?.error?.message
    if (errorMessage?.includes('size')) {
      uploadError.value = 'File size exceeds 10MB limit. Please compress your file and try again.'
    } else if (errorMessage?.includes('format') || errorMessage?.includes('.docx')) {
      uploadError.value = 'Invalid file format. Only .docx files are supported.'
    } else {
      uploadError.value = errorMessage || 'Upload failed. Please try again.'
    }

    toast.error('Template creation failed', uploadError.value)
  } finally {
    uploading.value = false
  }
}

const retryParsing = async (template) => {
  try {
    await api.post(`/templates/${template.id}/parse`)
    toast.success(
      'Parsing initiated',
      'Template parsing has been restarted. Please check back in a moment.'
    )
    fetchTemplates()
  } catch (error) {
    console.error('Retry failed:', error)
    toast.error(
      'Failed to retry parsing',
      'Please try again or contact support if the problem persists.'
    )
  }
}

const downloadTemplate = (template) => {
  try {
    const url = `${api.defaults.baseURL}/templates/${template.id}/download?format=docx`
    window.open(url, '_blank')

    toast.success(
      'Download started',
      `Downloading ${template.file ? template.file.filename : template.name}`
    )
  } catch (error) {
    console.error('Download failed:', error)
    toast.error('Download failed', 'Please try again or contact support.')
  }
}

const applyJobToTemplate = (template) => {
  selectedTemplate.value = template
  showApplyJobModal.value = true
  fetchCompletedJobs()
}

const submitApplyJob = async () => {
  try {
    applying.value = true
    const response = await api.post(
      `/templates/${selectedTemplate.value.id}/apply_job`,
      { job_id: selectedJobId.value }
    )

    toast.success(
      'Job applied successfully!',
      'Your tailored resume is ready. Download will start automatically.'
    )

    window.open(response.data.data.download_url, '_blank')
    closeApplyJobModal()
  } catch (error) {
    console.error('Apply job failed:', error)
    toast.error(
      'Failed to apply job',
      error.response?.data?.error?.message || 'Please try again or contact support.'
    )
  } finally {
    applying.value = false
  }
}

const confirmDelete = (template) => {
  templateToDelete.value = template
  showDeleteDialog.value = true
}

const cancelDelete = () => {
  templateToDelete.value = null
  showDeleteDialog.value = false
}

const handleDelete = async () => {
  if (!templateToDelete.value) return

  deleting.value = true

  try {
    await api.delete(`/templates/${templateToDelete.value.id}`)

    toast.success(
      'Template deleted',
      `"${templateToDelete.value.name}" has been permanently removed.`
    )

    showDeleteDialog.value = false
    templateToDelete.value = null
    fetchTemplates()
  } catch (error) {
    console.error('Delete failed:', error)
    toast.error(
      'Failed to delete template',
      'Please try again or contact support if the problem persists.'
    )
  } finally {
    deleting.value = false
  }
}

const viewTemplate = (template) => {
  selectedTemplate.value = template
  showEditorModal.value = true
}

const closeEditorModal = () => {
  showEditorModal.value = false
  selectedTemplate.value = null
  fetchTemplates()
}

const closeModal = () => {
  showUploadModal.value = false
  newTemplate.value = { name: '', content_text: '', file: null }
  uploadError.value = ''
  inputMode.value = 'file'
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const closeApplyJobModal = () => {
  showApplyJobModal.value = false
  selectedTemplate.value = null
  selectedJobId.value = ''
}

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
}

const getStatusVariant = (status) => {
  const variants = {
    pending: 'warning',
    parsing: 'info',
    completed: 'success',
    failed: 'error'
  }
  return variants[status] || 'default'
}

const formatStatus = (status) => {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
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
    day: 'numeric'
  })
}

const tokenDisplay = (tokenName) => {
  return `{{${tokenName}}}`
}
</script>
