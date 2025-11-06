<template>
  <div>
    <div class="text-center mb-8">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Upload Your Resume</h2>
      <p class="text-gray-600">
        Upload your resume to automatically extract your experience, skills, and education.
        <span class="text-blue-600 font-medium">This step is optional.</span>
      </p>
    </div>

    <!-- File Upload (shown when no resume is uploaded) -->
    <div v-if="!uploadedResumeId && !uploading" class="max-w-2xl mx-auto">
      <div
        @drop.prevent="handleDrop"
        @dragover.prevent="dragover = true"
        @dragleave.prevent="dragover = false"
        class="border-2 border-dashed rounded-lg p-12 text-center transition-colors"
        :class="{
          'border-blue-400 bg-blue-50': dragover,
          'border-gray-300 hover:border-gray-400': !dragover
        }"
      >
        <div class="flex flex-col items-center">
          <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <div class="mb-4">
            <label
              for="resume-upload"
              class="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
            >
              Click to upload
            </label>
            <span class="text-gray-600"> or drag and drop</span>
            <input
              id="resume-upload"
              ref="fileInput"
              type="file"
              accept=".docx"
              @change="handleFileSelect"
              class="hidden"
            />
          </div>

          <p class="text-sm text-gray-500">DOCX files only (Max 10MB)</p>
        </div>
      </div>

      <div class="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div class="flex">
          <svg class="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
          <div>
            <p class="text-sm text-yellow-800 font-medium">Note: Only DOCX format is supported</p>
            <p class="text-xs text-yellow-700 mt-1">
              If you have a PDF resume, please convert it to DOCX format first.
            </p>
          </div>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="errorMessage" class="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
          <p class="text-sm text-red-800">{{ errorMessage }}</p>
        </div>
      </div>
    </div>

    <!-- Uploading/Parsing State -->
    <div v-if="uploading || parsing" class="max-w-2xl mx-auto">
      <FeatureLoadingState
        :status-text="statusText"
        :progress="progress"
      />
    </div>

    <!-- Resume Parsed Successfully -->
    <div v-if="uploadedResumeId && resumeData && !uploading && !parsing" class="max-w-4xl mx-auto">
      <div class="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
        <div class="flex items-center">
          <svg class="w-6 h-6 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          <div>
            <p class="text-sm font-medium text-green-800">Resume uploaded and parsed successfully!</p>
            <p class="text-xs text-green-700 mt-1">Review the extracted information below.</p>
          </div>
        </div>
      </div>

      <!-- Parsed Data Display (simplified) -->
      <div class="bg-white border rounded-lg p-6 space-y-4">
        <div class="flex justify-between items-start">
          <h3 class="text-lg font-semibold text-gray-900">Parsed Resume Data</h3>
          <button
            @click="handleReupload"
            type="button"
            class="text-sm text-blue-600 hover:text-blue-700"
          >
            Upload Different Resume
          </button>
        </div>

        <!-- Display parsed data -->
        <div v-if="resumeData.personal_info" class="border-t pt-4">
          <h4 class="font-medium text-gray-900 mb-2">Personal Information</h4>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div v-if="resumeData.personal_info.name">
              <span class="text-gray-600">Name:</span>
              <span class="ml-2 text-gray-900">{{ resumeData.personal_info.name }}</span>
            </div>
            <div v-if="resumeData.personal_info.email">
              <span class="text-gray-600">Email:</span>
              <span class="ml-2 text-gray-900">{{ resumeData.personal_info.email }}</span>
            </div>
            <div v-if="resumeData.personal_info.phone">
              <span class="text-gray-600">Phone:</span>
              <span class="ml-2 text-gray-900">{{ resumeData.personal_info.phone }}</span>
            </div>
            <div v-if="resumeData.personal_info.location">
              <span class="text-gray-600">Location:</span>
              <span class="ml-2 text-gray-900">{{ resumeData.personal_info.location }}</span>
            </div>
          </div>
        </div>

        <div v-if="resumeData.skills && resumeData.skills.length > 0" class="border-t pt-4">
          <h4 class="font-medium text-gray-900 mb-2">Skills</h4>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(skill, index) in resumeData.skills.slice(0, 10)"
              :key="index"
              class="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              {{ skill }}
            </span>
            <span v-if="resumeData.skills.length > 10" class="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{{ resumeData.skills.length - 10 }} more
            </span>
          </div>
        </div>

        <div v-if="resumeData.experience && resumeData.experience.length > 0" class="border-t pt-4">
          <h4 class="font-medium text-gray-900 mb-2">Experience</h4>
          <p class="text-sm text-gray-600">{{ resumeData.experience.length }} positions found</p>
        </div>

        <div v-if="resumeData.education && resumeData.education.length > 0" class="border-t pt-4">
          <h4 class="font-medium text-gray-900 mb-2">Education</h4>
          <p class="text-sm text-gray-600">{{ resumeData.education.length }} education entries found</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { resumeService } from '@/services/resumeService'
import FeatureLoadingState from '../common/FeatureLoadingState.vue'

export default {
  name: 'ResumeStep',
  components: {
    FeatureLoadingState
  },
  data() {
    return {
      dragover: false,
      uploading: false,
      parsing: false,
      uploadedResumeId: null,
      resumeData: null,
      errorMessage: '',
      statusText: 'Uploading',
      progress: 0,
      pollingInterval: null
    }
  },
  methods: {
    handleDrop(event) {
      this.dragover = false
      const files = event.dataTransfer.files

      if (files.length > 0) {
        this.uploadFile(files[0])
      }
    },
    handleFileSelect(event) {
      const files = event.target.files
      if (files.length > 0) {
        this.uploadFile(files[0])
      }
    },
    async uploadFile(file) {
      // Validate file type
      if (!file.name.endsWith('.docx')) {
        this.errorMessage = 'Only DOCX files are supported. Please upload a .docx file.'
        return
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.errorMessage = 'File size must be less than 10MB.'
        return
      }

      this.errorMessage = ''
      this.uploading = true
      this.statusText = 'Uploading'
      this.progress = 20

      try {
        const formData = new FormData()
        formData.append('resume[file]', file)
        formData.append('resume[name]', file.name.replace('.docx', ''))

        const response = await resumeService.uploadResume(formData)
        this.uploadedResumeId = response.data.id

        this.uploading = false
        this.parsing = true
        this.statusText = 'Parsing Resume'
        this.progress = 40

        // Poll for parsing status
        this.startPolling()

        this.$emit('resume-uploaded', this.uploadedResumeId)
      } catch (error) {
        this.uploading = false
        this.errorMessage = error.response?.data?.error?.message || 'Failed to upload resume'
      }
    },
    startPolling() {
      let pollCount = 0
      const maxPolls = 60 // 60 seconds max

      this.pollingInterval = setInterval(async () => {
        pollCount++

        // Update progress
        this.progress = Math.min(40 + pollCount * 5, 95)

        try {
          const statusResponse = await resumeService.getResumeStatus(this.uploadedResumeId)
          const status = statusResponse.data.status

          if (status === 'parsed') {
            // Fetch full resume data
            const resumeResponse = await resumeService.getResume(this.uploadedResumeId)
            this.resumeData = resumeResponse.data.parsed_data

            this.parsing = false
            this.progress = 100
            clearInterval(this.pollingInterval)

            this.$emit('resume-parsed', this.resumeData)
          } else if (status === 'failed') {
            this.parsing = false
            this.errorMessage = 'Failed to parse resume. Please try again with a different file.'
            clearInterval(this.pollingInterval)
          }
        } catch (error) {
          console.error('Error polling status:', error)
        }

        // Stop polling after max attempts
        if (pollCount >= maxPolls) {
          this.parsing = false
          this.errorMessage = 'Resume parsing is taking longer than expected. Please check back later.'
          clearInterval(this.pollingInterval)
        }
      }, 2000) // Poll every 2 seconds
    },
    handleReupload() {
      this.uploadedResumeId = null
      this.resumeData = null
      this.errorMessage = ''
      this.progress = 0
      this.$refs.fileInput.value = ''
    }
  },
  beforeUnmount() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
    }
  },
  emits: ['resume-uploaded', 'resume-parsed']
}
</script>
