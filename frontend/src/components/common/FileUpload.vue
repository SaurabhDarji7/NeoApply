<template>
  <div class="file-upload">
    <div
      class="upload-area"
      :class="{ 'drag-over': isDragOver, 'has-file': selectedFile }"
      @drop.prevent="handleDrop"
      @dragover.prevent="isDragOver = true"
      @dragleave.prevent="isDragOver = false"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="acceptedTypes"
        @change="handleFileSelect"
        class="hidden"
      />

      <div v-if="!selectedFile" class="upload-prompt">
        <svg class="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p class="text-lg font-medium text-gray-700 mb-2">
          Drop your resume here or click to browse
        </p>
        <p class="text-sm text-gray-500">
          Supported formats: PDF, DOCX, TXT (Max 10MB)
        </p>
        <button
          type="button"
          @click="$refs.fileInput.click()"
          class="btn mt-4"
        >
          Select File
        </button>
      </div>

      <div v-else class="file-preview">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <svg class="file-icon text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
            </svg>
            <div>
              <p class="font-medium text-gray-900">{{ selectedFile.name }}</p>
              <p class="text-sm text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
            </div>
          </div>
          <button
            type="button"
            @click="clearFile"
            class="text-red-600 hover:text-red-800"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div v-if="error" class="mt-4 rounded-md bg-red-50 p-4">
      <p class="text-sm text-red-800">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits } from 'vue'

const props = defineProps({
  acceptedTypes: {
    type: String,
    default: '.pdf,.docx,.txt'
  },
  maxSize: {
    type: Number,
    default: 10 * 1024 * 1024 // 10MB
  }
})

const emit = defineEmits(['file-selected', 'file-cleared'])

const fileInput = ref(null)
const selectedFile = ref(null)
const isDragOver = ref(false)
const error = ref(null)

const validateFile = (file) => {
  error.value = null

  // Check file size
  if (file.size > props.maxSize) {
    error.value = `File size must be less than ${formatFileSize(props.maxSize)}`
    return false
  }

  // Check file type
  const allowedTypes = props.acceptedTypes.split(',').map(t => t.trim())
  const fileExtension = '.' + file.name.split('.').pop().toLowerCase()

  if (!allowedTypes.includes(fileExtension)) {
    error.value = `File type not supported. Allowed types: ${allowedTypes.join(', ')}`
    return false
  }

  return true
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file && validateFile(file)) {
    selectedFile.value = file
    emit('file-selected', file)
  }
}

const handleDrop = (event) => {
  isDragOver.value = false
  const file = event.dataTransfer.files[0]
  if (file && validateFile(file)) {
    selectedFile.value = file
    emit('file-selected', file)
  }
}

const clearFile = () => {
  selectedFile.value = null
  error.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  emit('file-cleared')
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

defineExpose({
  clearFile
})
</script>

<style scoped>
.upload-area {
  @apply border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors;
}

.upload-area.drag-over {
  @apply border-primary bg-blue-50;
}

.upload-area.has-file {
  @apply border-solid border-gray-300 bg-gray-50;
}

.upload-prompt {
  @apply flex flex-col items-center;
}

.upload-icon {
  @apply w-16 h-16 text-gray-400 mb-4;
}

.file-preview {
  @apply p-4;
}

.file-icon {
  @apply w-10 h-10;
}
</style>
