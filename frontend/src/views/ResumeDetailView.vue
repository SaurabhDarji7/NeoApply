<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p class="text-gray-600 mt-4">Loading resume...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="card text-center py-12">
        <p class="text-red-600 mb-4">{{ error }}</p>
        <router-link to="/resumes" class="btn">Back to Resumes</router-link>
      </div>

      <!-- Resume Detail -->
      <div v-else-if="resume">
        <!-- Header -->
        <div class="mb-6">
          <router-link to="/resumes" class="text-primary hover:text-blue-700 flex items-center mb-4">
            <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Resumes
          </router-link>
          <div class="flex justify-between items-start">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">{{ resume.name }}</h1>
              <p class="text-gray-600 mt-1">Uploaded {{ formatDate(resume.created_at) }}</p>
            </div>
            <span :class="statusClass(resume.status)" class="px-3 py-1 text-sm font-semibold rounded-full">
              {{ resume.status }}
            </span>
          </div>
        </div>

        <!-- File Info Card -->
        <div class="card mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">File Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-600">Filename</p>
              <p class="font-medium text-gray-900">{{ resume.file?.filename || 'N/A' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">File Size</p>
              <p class="font-medium text-gray-900">{{ formatFileSize(resume.file?.byte_size) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Content Type</p>
              <p class="font-medium text-gray-900">{{ resume.file?.content_type || 'N/A' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Last Updated</p>
              <p class="font-medium text-gray-900">{{ formatDate(resume.updated_at) }}</p>
            </div>
          </div>

          <div class="mt-6 flex space-x-4">
            <a
              v-if="resume.file"
              :href="getDownloadUrl(resume.id)"
              target="_blank"
              class="btn flex items-center space-x-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download</span>
            </a>
            <button
              v-if="resume.status === 'processing' || resume.status === 'pending'"
              @click="refreshStatus"
              class="btn-secondary flex items-center space-x-2"
              :disabled="refreshing"
            >
              <svg class="w-5 h-5" :class="{ 'animate-spin': refreshing }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{{ refreshing ? 'Checking...' : 'Refresh Status' }}</span>
            </button>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="resume.status === 'failed' && resume.error_message" class="card mb-6 bg-red-50 border border-red-200">
          <h2 class="text-lg font-semibold text-red-900 mb-2">Error Details</h2>
          <p class="text-red-700">{{ resume.error_message }}</p>
        </div>

        <!-- Parsed Data -->
        <div v-if="resume.parsed_data" class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Parsed Information</h2>

          <!-- Personal Information -->
          <div v-if="resume.parsed_data.personal_info" class="mb-6">
            <h3 class="text-md font-semibold text-gray-800 mb-3">Personal Information</h3>
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-if="resume.parsed_data.personal_info.name">
                  <p class="text-sm text-gray-600">Name</p>
                  <p class="font-medium text-gray-900">{{ resume.parsed_data.personal_info.name }}</p>
                </div>
                <div v-if="resume.parsed_data.personal_info.email">
                  <p class="text-sm text-gray-600">Email</p>
                  <p class="font-medium text-gray-900">{{ resume.parsed_data.personal_info.email }}</p>
                </div>
                <div v-if="resume.parsed_data.personal_info.phone">
                  <p class="text-sm text-gray-600">Phone</p>
                  <p class="font-medium text-gray-900">{{ resume.parsed_data.personal_info.phone }}</p>
                </div>
                <div v-if="resume.parsed_data.personal_info.location">
                  <p class="text-sm text-gray-600">Location</p>
                  <p class="font-medium text-gray-900">{{ resume.parsed_data.personal_info.location }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Skills -->
          <div v-if="resume.parsed_data.skills && resume.parsed_data.skills.length > 0" class="mb-6">
            <h3 class="text-md font-semibold text-gray-800 mb-3">Skills</h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="skill in resume.parsed_data.skills"
                :key="skill"
                class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {{ skill }}
              </span>
            </div>
          </div>

          <!-- Experience -->
          <div v-if="resume.parsed_data.experience && resume.parsed_data.experience.length > 0" class="mb-6">
            <h3 class="text-md font-semibold text-gray-800 mb-3">Experience</h3>
            <div class="space-y-4">
              <div
                v-for="(exp, index) in resume.parsed_data.experience"
                :key="index"
                class="bg-gray-50 rounded-lg p-4"
              >
                <h4 class="font-semibold text-gray-900">{{ exp.title }}</h4>
                <p class="text-gray-700">{{ exp.company }}</p>
                <p class="text-sm text-gray-600">{{ exp.duration }}</p>
                <p v-if="exp.description" class="text-gray-700 mt-2">{{ exp.description }}</p>
              </div>
            </div>
          </div>

          <!-- Education -->
          <div v-if="resume.parsed_data.education && resume.parsed_data.education.length > 0" class="mb-6">
            <h3 class="text-md font-semibold text-gray-800 mb-3">Education</h3>
            <div class="space-y-4">
              <div
                v-for="(edu, index) in resume.parsed_data.education"
                :key="index"
                class="bg-gray-50 rounded-lg p-4"
              >
                <h4 class="font-semibold text-gray-900">{{ edu.degree }}</h4>
                <p class="text-gray-700">{{ edu.institution }}</p>
                <p class="text-sm text-gray-600">{{ edu.year }}</p>
              </div>
            </div>
          </div>

          <!-- Raw Parsed Data (for debugging) -->
          <details class="mt-6">
            <summary class="cursor-pointer text-sm text-gray-600 hover:text-gray-900">View Raw JSON Data</summary>
            <pre class="mt-2 p-4 bg-gray-800 text-gray-100 rounded-lg overflow-x-auto text-xs">{{ JSON.stringify(resume.parsed_data, null, 2) }}</pre>
          </details>
        </div>

        <!-- No Parsed Data Yet -->
        <div v-else class="card text-center py-12">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-gray-600 mb-2">No parsed data available yet</p>
          <p v-if="resume.status === 'pending'" class="text-sm text-gray-500">Parsing will begin shortly...</p>
          <p v-else-if="resume.status === 'processing'" class="text-sm text-gray-500">Parsing is in progress...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useResumeStore } from '@/stores/resume'
import resumeService from '@/services/resumeService'

const route = useRoute()
const resumeStore = useResumeStore()

const refreshing = ref(false)

const resume = computed(() => resumeStore.currentResume)
const loading = computed(() => resumeStore.loading)
const error = computed(() => resumeStore.error)

onMounted(async () => {
  await loadResume()
})

const loadResume = async () => {
  try {
    await resumeStore.fetchResume(route.params.id)
  } catch (err) {
    console.error('Failed to load resume:', err)
  }
}

const refreshStatus = async () => {
  refreshing.value = true
  try {
    await resumeStore.checkStatus(route.params.id)
  } catch (err) {
    console.error('Failed to refresh status:', err)
  } finally {
    refreshing.value = false
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
