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
      <FileUpload
        ref="fileUploadRef"
        accepted-types=".docx"
        @file-selected="uploadFile"
      />

      <Alert
        type="warning"
        message="Note: Only DOCX format is supported. If you have a PDF resume, please convert it to DOCX format first."
        class="mt-6"
      />

      <!-- Error Display -->
      <Alert type="error" :message="errorMessage" class="mt-4" />
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
      <Alert
        type="success"
        message="Resume uploaded and parsed successfully! Review the extracted information below."
        class="mb-6"
      />

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
import FileUpload from '../common/FileUpload.vue'
import Alert from '../common/Alert.vue'

export default {
  name: 'ResumeStep',
  components: {
    FeatureLoadingState,
    FileUpload,
    Alert
  },
  data() {
    return {
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
    async uploadFile(file) {
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
      if (this.$refs.fileUploadRef) {
        this.$refs.fileUploadRef.clearFile()
      }
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
