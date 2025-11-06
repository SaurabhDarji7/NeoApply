<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">My Resumes</h1>
          <p class="text-gray-600 mt-1">Upload and manage your resume files</p>
        </div>
        <button
          @click="showUploadModal = true"
          class="btn flex items-center space-x-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Upload Resume</span>
        </button>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="card">
          <p class="text-sm text-gray-600">Total</p>
          <p class="text-3xl font-bold text-gray-900">{{ resumes.length }}</p>
        </div>
        <div class="card">
          <p class="text-sm text-gray-600">Parsed</p>
          <p class="text-3xl font-bold text-green-600">{{ resumeStore.statusCount('parsed') }}</p>
        </div>
        <div class="card">
          <p class="text-sm text-gray-600">Processing</p>
          <p class="text-3xl font-bold text-blue-600">{{ resumeStore.statusCount('processing') }}</p>
        </div>
        <div class="card">
          <p class="text-sm text-gray-600">Failed</p>
          <p class="text-3xl font-bold text-red-600">{{ resumeStore.statusCount('failed') }}</p>
        </div>
      </div>

      <!-- Resume List -->
      <div class="card">
        <div v-if="loading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p class="text-gray-600 mt-4">Loading resumes...</p>
        </div>

        <div v-else-if="error" class="text-center py-12">
          <p class="text-red-600">{{ error }}</p>
          <button @click="loadResumes" class="btn mt-4">Retry</button>
        </div>

        <EmptyState
          v-else-if="resumes.length === 0"
          title="No resumes uploaded yet"
          description="Upload your resume to get started with personalized job applications."
          :action="true"
          action-label="Upload Your First Resume"
          @action="showUploadModal = true"
        >
          <template #icon>
            <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </template>
        </EmptyState>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Info</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="resume in resumes" :key="resume.id" class="hover:bg-gray-50">
                <td class="px-6 py-4">
                  <router-link :to="`/resumes/${resume.id}`" class="text-primary hover:text-blue-700 font-medium">
                    {{ resume.name }}
                  </router-link>
                </td>
                <td class="px-6 py-4">
                  <StatusTag :variant="getStatusVariant(resume.status)">
                    {{ resume.status }}
                  </StatusTag>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  <div v-if="resume.file">
                    <p>{{ resume.file.filename }}</p>
                    <p class="text-xs text-gray-500">{{ formatFileSize(resume.file.byte_size) }}</p>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  {{ formatDate(resume.created_at) }}
                </td>
                <td class="px-6 py-4 text-right text-sm space-x-2">
                  <router-link :to="`/resumes/${resume.id}`" class="text-primary hover:text-blue-700">
                    View
                  </router-link>
                  <a
                    v-if="resume.file"
                    :href="getDownloadUrl(resume.id)"
                    target="_blank"
                    class="text-green-600 hover:text-green-800"
                  >
                    Download
                  </a>
                  <button
                    @click="handleDelete(resume.id)"
                    class="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Upload Modal -->
    <Modal
      v-model="showUploadModal"
      title="Upload Resume"
      size="lg"
      @close="closeUploadModal"
    >
      <form @submit.prevent="handleUpload">
        <div class="mb-6">
          <label for="resume-name" class="block text-sm font-medium text-gray-700 mb-2">
            Resume Name
          </label>
          <input
            id="resume-name"
            v-model="uploadForm.name"
            type="text"
            required
            class="input"
            placeholder="e.g., Software Engineer Resume 2024"
          />
        </div>

        <div class="mb-6">
          <FileUpload
            ref="fileUploadRef"
            @file-selected="handleFileSelected"
            @file-cleared="uploadForm.file = null"
          />
        </div>

        <div v-if="uploadError" class="mb-6 rounded-md bg-red-50 p-4">
          <p class="text-sm text-red-800">{{ uploadError }}</p>
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end space-x-4">
          <Button
            variant="secondary"
            @click="closeUploadModal"
            :disabled="uploading"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            @click="handleUpload"
            :disabled="!uploadForm.file || uploading"
            :loading="uploading"
          >
            Upload
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal
      v-model="showDeleteModal"
      title="Delete Resume"
      size="sm"
    >
      <p class="text-gray-600">
        Are you sure you want to delete this resume? This action cannot be undone.
      </p>

      <template #footer>
        <div class="flex justify-end space-x-4">
          <Button
            variant="secondary"
            @click="showDeleteModal = false"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            @click="confirmDelete"
          >
            Delete
          </Button>
        </div>
      </template>
    </Modal>

    <!-- FAB for Upload -->
    <FAB
      aria-label="Upload Resume"
      @click="showUploadModal = true"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useResumeStore } from '@/stores/resume'
import resumeService from '@/services/resumeService'
import FileUpload from '@/components/common/FileUpload.vue'
import Button from '@/components/common/Button.vue'
import FAB from '@/components/common/FAB.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import Modal from '@/components/common/Modal.vue'
import { useToast } from '@/composables/useToast'

const toast = useToast()

const resumeStore = useResumeStore()

const showUploadModal = ref(false)
const showDeleteModal = ref(false)
const resumeToDelete = ref(null)
const uploadForm = ref({
  name: '',
  file: null
})
const uploadError = ref(null)
const uploading = ref(false)
const fileUploadRef = ref(null)

const resumes = computed(() => resumeStore.resumes)
const loading = computed(() => resumeStore.loading)
const error = computed(() => resumeStore.error)

onMounted(() => {
  loadResumes()
})

const loadResumes = async () => {
  try {
    await resumeStore.fetchResumes()
  } catch (err) {
    console.error('Failed to load resumes:', err)
  }
}

const handleFileSelected = (file) => {
  uploadForm.value.file = file
  if (!uploadForm.value.name) {
    uploadForm.value.name = file.name.replace(/\.[^/.]+$/, '')
  }
}

const handleUpload = async () => {
  if (!uploadForm.value.file) return

  uploading.value = true
  uploadError.value = null

  try {
    await resumeStore.uploadResume(uploadForm.value.file, uploadForm.value.name)
    toast.success('Resume uploaded successfully', 'Your resume is now being processed.')
    closeUploadModal()
  } catch (err) {
    const errorMessage = err.response?.data?.error?.message || 'Failed to upload resume'
    uploadError.value = errorMessage
    toast.error('Upload failed', errorMessage)
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

const handleDelete = (id) => {
  resumeToDelete.value = id
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!resumeToDelete.value) return

  try {
    await resumeStore.deleteResume(resumeToDelete.value)
    toast.success('Resume deleted', 'The resume has been successfully deleted.')
    showDeleteModal.value = false
    resumeToDelete.value = null
  } catch (err) {
    toast.error('Delete failed', 'Failed to delete the resume. Please try again.')
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
    failed: 'danger'
  }
  return variants[status] || 'neutral'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
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
