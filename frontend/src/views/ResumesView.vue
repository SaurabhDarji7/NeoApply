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

        <div v-else-if="resumes.length === 0" class="text-center py-12">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-gray-600 mb-4">No resumes uploaded yet</p>
          <button @click="showUploadModal = true" class="btn">Upload Your First Resume</button>
        </div>

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
                  <span :class="statusClass(resume.status)" class="px-2 py-1 text-xs font-semibold rounded-full">
                    {{ resume.status }}
                  </span>
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
    <div v-if="showUploadModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Upload Resume</h2>
          <button @click="closeUploadModal" class="text-gray-500 hover:text-gray-700">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

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

          <div class="flex justify-end space-x-4">
            <button
              type="button"
              @click="closeUploadModal"
              class="btn-secondary"
              :disabled="uploading"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn"
              :disabled="!uploadForm.file || uploading"
            >
              {{ uploading ? 'Uploading...' : 'Upload' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useResumeStore } from '@/stores/resume'
import resumeService from '@/services/resumeService'
import FileUpload from '@/components/common/FileUpload.vue'

const resumeStore = useResumeStore()

const showUploadModal = ref(false)
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
    closeUploadModal()
  } catch (err) {
    uploadError.value = err.response?.data?.error?.message || 'Failed to upload resume'
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

const handleDelete = async (id) => {
  if (!confirm('Are you sure you want to delete this resume?')) return

  try {
    await resumeStore.deleteResume(id)
  } catch (err) {
    alert('Failed to delete resume')
  }
}

const getDownloadUrl = (id) => {
  return resumeService.getDownloadUrl(id)
}

const statusClass = (status) => {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    parsed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
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
