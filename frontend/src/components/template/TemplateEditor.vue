<template>
  <div class="template-editor-modal fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
    <div class="editor-container bg-white rounded-lg shadow-2xl w-full h-full max-w-7xl max-h-[95vh] m-4 flex flex-col">
      <!-- Header -->
      <div class="editor-header bg-gray-800 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
        <div class="flex items-center gap-4">
          <h2 class="text-2xl font-bold">{{ template?.name }}</h2>
          <span v-if="currentMode === 'edit'" class="px-3 py-1 bg-blue-600 text-white rounded-full text-sm">
            Edit Mode
          </span>
          <span v-else class="px-3 py-1 bg-green-600 text-white rounded-full text-sm">
            Preview Mode
          </span>
        </div>
        <div class="flex items-center gap-3">
          <!-- Mode Toggle -->
          <button
            v-if="selectedJob"
            @click="toggleMode"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-2"
          >
            <svg v-if="currentMode === 'edit'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {{ currentMode === 'edit' ? 'Preview' : 'Edit' }}
          </button>

          <!-- Export PDF -->
          <button
            v-if="currentMode === 'preview'"
            @click="exportPDF"
            :disabled="exporting"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-md transition-colors flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {{ exporting ? 'Exporting...' : 'Export PDF' }}
          </button>

          <!-- Close -->
          <button
            @click="closeEditor"
            class="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <!-- Token Picker Sidebar (Edit Mode Only) -->
      <div class="editor-body flex flex-1 overflow-hidden">
        <div v-if="currentMode === 'edit'" class="help-sidebar bg-gradient-to-b from-blue-50 to-white border-r border-gray-200 p-6 w-96 overflow-y-auto">
          <div class="mb-6">
            <h3 class="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Template Editor Guide
            </h3>
            <p class="text-sm text-gray-600">Use the context menu (right-click) to work with tokens and skill zones</p>
          </div>

          <!-- Job Selector -->
          <div class="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <label class="block text-sm font-semibold text-gray-900 mb-2">Select Job for Preview</label>
            <select
              v-model="selectedJobId"
              @change="onJobSelected"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">-- Select a job --</option>
              <option v-for="job in completedJobs" :key="job.id" :value="job.id">
                {{ job.title }} at {{ job.company_name }}
              </option>
            </select>
          </div>

          <!-- Preview Options -->
          <div v-if="selectedJob" class="mb-6 p-4 bg-blue-100 border border-blue-300 rounded-lg space-y-3">
            <h4 class="text-sm font-semibold text-gray-900 flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Preview Settings
            </h4>
            <div class="space-y-2">
              <div class="flex items-center justify-between bg-white p-2 rounded">
                <label class="text-xs text-gray-700 cursor-pointer" for="boldTokensToggle">
                  Bold replaced values
                </label>
                <input
                  id="boldTokensToggle"
                  type="checkbox"
                  v-model="boldTokens"
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
              </div>
              <div class="flex items-center justify-between bg-white p-2 rounded">
                <label class="text-xs text-gray-700 cursor-pointer" for="highlightSkillsToggle">
                  Highlight job skills
                </label>
                <input
                  id="highlightSkillsToggle"
                  type="checkbox"
                  v-model="highlightSkills"
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <!-- Token Insertion Buttons -->
          <div class="space-y-3 mb-6">
            <h4 class="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Insert Tokens
            </h4>
            <p class="text-xs text-gray-600 mb-2">Click to copy, then paste in document (Ctrl+V)</p>
            <div class="grid grid-cols-1 gap-2">
              <button
                v-for="token in availableTokens"
                :key="token.key"
                @click="insertTokenIntoDocument(token.key)"
                class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors text-left flex items-center justify-between group"
              >
                <span>{{ formatTokenDisplay(token.key) }}</span>
                <svg class="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Skill Zone Button -->
          <div class="space-y-3">
            <h4 class="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Skill Zone Markers
            </h4>
            <p class="text-xs text-gray-600 mb-2">Wrap experience sections to highlight matching skills</p>
            <button
              @click="wrapSelectionInSkillZone"
              class="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Skill Zone Markers
            </button>
            <div class="mt-2 p-2 bg-green-50 rounded text-xs text-gray-700">
              <p class="font-medium mb-1">Usage:</p>
              <p>1. Click button to copy start marker</p>
              <p>2. Paste before your experience text</p>
              <p>3. Click again for end marker</p>
              <p>4. Paste after your experience text</p>
            </div>
          </div>

          <div v-if="!selectedJob" class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p class="text-xs text-yellow-800">
              <span class="font-semibold">💡 Tip:</span> Select a job description above to enable preview and PDF export.
            </p>
          </div>
        </div>

        <!-- Floating Token Picker Dropdown - Bubble.io Style -->
        <div
          v-if="showFloatingMenu && currentMode === 'edit'"
          :style="{
            position: 'fixed',
            left: floatingMenuPosition.x + 'px',
            top: floatingMenuPosition.y + 'px',
            zIndex: 9999
          }"
          class="floating-menu bg-white rounded-lg shadow-2xl border-2 border-blue-500 overflow-hidden"
          @mousedown.stop
          style="min-width: 350px; max-height: 500px; overflow-y: auto;"
        >
          <!-- Header -->
          <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-white sticky top-0 z-10">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span class="font-semibold text-sm">Insert Dynamic Token</span>
              </div>
              <button @click="showFloatingMenu = false" class="hover:bg-blue-800 rounded p-1 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p class="text-xs text-blue-100 mt-1 truncate">Replace: "{{ selectedText }}"</p>
          </div>

          <!-- Token Options -->
          <div class="p-2">
            <button
              v-for="token in availableTokens"
              :key="token.key"
              @click="replaceSelectionWithToken(token.key)"
              class="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-lg transition-colors flex items-start gap-3 group border-b border-gray-100 last:border-0"
            >
              <div class="flex-shrink-0 w-8 h-8 bg-blue-100 group-hover:bg-blue-200 rounded-full flex items-center justify-center mt-0.5 transition-colors">
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-gray-900">{{ formatTokenDisplay(token.key) }}</div>
                <div class="text-xs text-gray-500 truncate mt-0.5">{{ token.preview || 'No preview available' }}</div>
              </div>
              <div class="flex-shrink-0">
                <svg class="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>

          <!-- Divider -->
          <div class="border-t-2 border-gray-200 my-1"></div>

          <!-- Skill Zone Option -->
          <div class="p-2">
            <button
              @click="markAsSkillZone"
              class="w-full text-left px-4 py-3 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-3 group"
            >
              <div class="flex-shrink-0 w-8 h-8 bg-green-100 group-hover:bg-green-200 rounded-full flex items-center justify-center transition-colors">
                <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div class="flex-1">
                <div class="text-sm font-semibold text-gray-900">Mark as Skill Zone</div>
                <div class="text-xs text-gray-500">Wrap selection for skill highlighting</div>
              </div>
            </button>
          </div>
        </div>

        <!-- OnlyOffice Editor Container -->
        <div class="editor-content flex-1 relative" @mouseup="handleMouseUp">
          <div
            v-if="loading"
            class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10"
          >
            <div class="text-center">
              <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p class="text-gray-600">{{ loadingMessage }}</p>
            </div>
          </div>

          <div
            v-if="error"
            class="absolute inset-0 flex items-center justify-center bg-red-50 z-10"
          >
            <div class="text-center px-6">
              <svg class="w-16 h-16 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Editor Error</h3>
              <p class="text-gray-600 mb-4">{{ error }}</p>
              <button
                @click="retryLoad"
                class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>

          <!-- OnlyOffice will be mounted here -->
          <div id="onlyoffice-editor" class="w-full h-full"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import templateService from '@/services/templateService'
import jobDescriptionService from '@/services/jobDescriptionService'
import api from '@/services/api'

const props = defineProps({
  templateId: {
    type: [String, Number],
    required: true
  }
})

const emit = defineEmits(['close'])

const route = useRoute()
const router = useRouter()

const template = ref(null)
const loading = ref(true)
const loadingMessage = ref('Initializing editor...')
const error = ref(null)
const editorInstance = ref(null)
const completedJobs = ref([])
const selectedJobId = ref('')
const selectedJob = ref(null)
const currentMode = ref('edit') // 'edit' or 'preview'
const exporting = ref(false)
const processedDocumentUrl = ref(null)
const boldTokens = ref(true) // Default: ON - bold replaced tokens
const highlightSkills = ref(false) // Default: OFF - highlight skills in marked zones
const showFloatingMenu = ref(false)
const floatingMenuPosition = ref({ x: 0, y: 0 })
const selectedText = ref('')

// Available tokens with their preview values
const availableTokens = computed(() => {
  if (!selectedJob.value || !selectedJob.value.parsed_attributes) return []

  const attrs = selectedJob.value.parsed_attributes

  return [
    { key: 'company_name', preview: attrs.company_name || 'N/A' },
    { key: 'title', preview: attrs.title || 'N/A' },
    { key: 'job_location', preview: attrs.job_location || 'N/A' },
    { key: 'job_type', preview: attrs.job_type || 'N/A' },
    { key: 'experience_level', preview: attrs.experience_level || 'N/A' },
    { key: 'top_5_skills_needed', preview: Array.isArray(attrs.top_5_skills_needed) ? attrs.top_5_skills_needed.join(', ') : 'N/A' },
    { key: 'skills_required', preview: attrs.skills_required?.length ? `${attrs.skills_required.length} skills` : 'N/A' },
    { key: 'responsibilities', preview: attrs.responsibilities?.length ? `${attrs.responsibilities.length} items` : 'N/A' },
    { key: 'qualifications', preview: attrs.qualifications?.length ? `${attrs.qualifications.length} items` : 'N/A' },
    { key: 'salary_range', preview: attrs.salary_range ? formatSalary(attrs.salary_range) : 'N/A' }
  ]
})

const formatSalary = (salaryRange) => {
  if (!salaryRange || (!salaryRange.min && !salaryRange.max)) return 'N/A'

  const currency = salaryRange.currency || 'USD'
  if (salaryRange.min && salaryRange.max) {
    return `${currency} ${salaryRange.min.toLocaleString()}-${salaryRange.max.toLocaleString()}`
  } else if (salaryRange.min) {
    return `${currency} ${salaryRange.min.toLocaleString()}+`
  }
  return 'N/A'
}

const formatTokenDisplay = (tokenKey) => {
  return `{{${tokenKey}}}`
}

const loadTemplate = async () => {
  try {
    const response = await templateService.getTemplate(props.templateId)
    template.value = response.data.data || response.data
  } catch (err) {
    console.error('Failed to load template:', err)
    error.value = 'Failed to load template details'
  }
}

const loadCompletedJobs = async () => {
  try {
    const response = await jobDescriptionService.getAll({ status: 'completed' })
    completedJobs.value = response.data.data || response.data
  } catch (err) {
    console.error('Failed to load jobs:', err)
  }
}

const onJobSelected = () => {
  selectedJob.value = completedJobs.value.find(j => j.id === parseInt(selectedJobId.value))
}

const initializeOnlyOffice = async () => {
  try {
    loadingMessage.value = 'Loading editor configuration...'

    // Get editor config from backend
    const configResponse = await templateService.getEditorConfig(props.templateId)
    const { config, onlyoffice_url } = configResponse.data.data

    loadingMessage.value = 'Initializing OnlyOffice...'

    // Load OnlyOffice API script
    await loadOnlyOfficeScript(onlyoffice_url)

    // Initialize editor
    const editorConfig = {
      ...config,
      events: {
        onReady: onEditorReady,
        onError: onEditorError,
        onDocumentStateChange: onDocumentStateChange,
        onRequestInsertImage: onRequestInsertImage
      }
    }

    // Create editor instance
    editorInstance.value = new window.DocsAPI.DocEditor('onlyoffice-editor', editorConfig)

    loading.value = false
  } catch (err) {
    console.error('Failed to initialize OnlyOffice:', err)
    error.value = `Failed to initialize editor: ${err.message}`
    loading.value = false
  }
}

const loadOnlyOfficeScript = (onlyofficeUrl) => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.DocsAPI) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = `${onlyofficeUrl}/web-apps/apps/api/documents/api.js`
    script.onload = resolve
    script.onerror = () => reject(new Error('Failed to load OnlyOffice API'))
    document.head.appendChild(script)
  })
}

const onEditorReady = () => {
  console.log('OnlyOffice editor ready')
}

const onEditorError = (event) => {
  console.error('OnlyOffice error:', event)
  error.value = `Editor error: ${event.data}`
}

const onDocumentStateChange = (event) => {
  console.log('Document state changed:', event)
}

const onRequestInsertImage = (event) => {
  console.log('Insert image requested:', event)
}

// Handle mouse up to detect text selection
const handleMouseUp = (event) => {
  setTimeout(() => {
    const selection = window.getSelection()
    const text = selection?.toString().trim()

    if (text && text.length > 0) {
      selectedText.value = text

      // Get selection coordinates
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      // Position floating menu above selection
      floatingMenuPosition.value = {
        x: rect.left + (rect.width / 2) - 100, // Center it
        y: rect.top
      }

      showFloatingMenu.value = true
    } else {
      showFloatingMenu.value = false
    }
  }, 10)
}

// Toggle token dropdown
const toggleTokenDropdown = () => {
  // Show modal with token list
  const tokenKey = prompt('Enter token name:\n\n' +
    'Options:\n' +
    '• company_name\n' +
    '• title\n' +
    '• job_location\n' +
    '• job_type\n' +
    '• experience_level\n' +
    '• skills_required\n' +
    '• responsibilities\n' +
    '• qualifications\n' +
    '• salary_range'
  )

  if (tokenKey) {
    replaceSelectionWithToken(tokenKey)
  }
}

// Replace selected text with token using document.execCommand
const replaceSelectionWithToken = (tokenKey) => {
  const tokenText = `{{${tokenKey}}}`

  try {
    // Use execCommand to replace selection (works across iframes if focused)
    document.execCommand('insertText', false, tokenText)
    showFloatingMenu.value = false
    showNotification(`✓ Replaced with ${tokenText}`)
  } catch (err) {
    console.error('Replace error:', err)
    // Fallback: tell user to manually type it
    alert(`Please manually replace the selected text with:\n\n${tokenText}`)
  }
}

// Mark selection as skill zone
const markAsSkillZone = () => {
  if (!selectedText.value) {
    alert('No text selected')
    return
  }

  const wrappedText = `<<SKILLS_START>>\n${selectedText.value}\n<<SKILLS_END>>`

  try {
    document.execCommand('insertText', false, wrappedText)
    showFloatingMenu.value = false
    showNotification('✓ Skill zone markers added!')
  } catch (err) {
    console.error('Wrap error:', err)
    alert(`Please replace your selection with:\n\n${wrappedText}`)
  }
}

// Insert token - for sidebar buttons
const insertTokenIntoDocument = async (tokenKey) => {
  const tokenText = `{{${tokenKey}}}`
  await navigator.clipboard.writeText(tokenText)
  showNotification(`✓ ${tokenText} copied! Paste in document (Ctrl+V)`)
}

// Show notification helper
const showNotification = (message) => {
  const notification = document.createElement('div')
  notification.textContent = message
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #10B981;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-size: 14px;
    max-width: 400px;
  `

  document.body.appendChild(notification)
  setTimeout(() => notification.remove(), 3000)
}

const toggleMode = async () => {
  if (currentMode.value === 'edit') {
    // Switch to preview mode
    await switchToPreview()
  } else {
    // Switch back to edit mode
    await switchToEdit()
  }
}

const switchToPreview = async () => {
  if (!selectedJobId.value) {
    alert('Please select a job description first')
    return
  }

  try {
    loading.value = true
    loadingMessage.value = 'Generating preview with job data...'

    // Apply job tokens to template with formatting options
    const response = await templateService.applyJobTokens(
      props.templateId,
      selectedJobId.value,
      {
        boldTokens: boldTokens.value,
        highlightSkills: highlightSkills.value
      }
    )
    processedDocumentUrl.value = response.data.data.download_url

    // Destroy current editor
    if (editorInstance.value) {
      editorInstance.value.destroyEditor()
      editorInstance.value = null
    }

    // Reinitialize in view mode with processed document
    const configResponse = await templateService.getEditorConfig(props.templateId)
    const { onlyoffice_url } = configResponse.data.data

    const viewConfig = {
      documentType: 'word',
      document: {
        fileType: 'docx',
        key: `preview_${Date.now()}`,
        title: `${template.value.name} - Preview`,
        url: processedDocumentUrl.value,
        permissions: {
          edit: false,
          download: true,
          print: true
        }
      },
      editorConfig: {
        mode: 'view',
        lang: 'en'
      },
      type: 'desktop'
    }

    editorInstance.value = new window.DocsAPI.DocEditor('onlyoffice-editor', viewConfig)
    currentMode.value = 'preview'
    loading.value = false
  } catch (err) {
    console.error('Failed to switch to preview:', err)
    error.value = 'Failed to generate preview'
    loading.value = false
  }
}

const switchToEdit = async () => {
  try {
    loading.value = true
    loadingMessage.value = 'Switching to edit mode...'

    // Destroy current editor
    if (editorInstance.value) {
      editorInstance.value.destroyEditor()
      editorInstance.value = null
    }

    // Reinitialize in edit mode
    await initializeOnlyOffice()

    currentMode.value = 'edit'
    loading.value = false
  } catch (err) {
    console.error('Failed to switch to edit mode:', err)
    error.value = 'Failed to switch to edit mode'
    loading.value = false
  }
}

const exportPDF = async () => {
  if (!processedDocumentUrl.value) {
    alert('Please preview the document first')
    return
  }

  try {
    exporting.value = true
    loading.value = true
    loadingMessage.value = 'Converting to PDF...'

    // Call backend to convert to PDF using OnlyOffice
    const response = await templateService.exportPdf(props.templateId)
    const pdfUrl = response.data.data.pdf_url

    // Download the PDF
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = `${template.value.name}_${selectedJob.value.company_name}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    loading.value = false
    exporting.value = false
    alert('PDF downloaded successfully!')
  } catch (err) {
    console.error('Export failed:', err)
    const errorMsg = err.response?.data?.error?.message || 'Failed to export PDF'
    alert(errorMsg)
    loading.value = false
    exporting.value = false
  }
}

const retryLoad = () => {
  error.value = null
  loading.value = true
  initializeOnlyOffice()
}

const closeEditor = () => {
  if (editorInstance.value) {
    editorInstance.value.destroyEditor()
  }
  emit('close')
}

onMounted(async () => {
  await loadTemplate()
  await loadCompletedJobs()
  await initializeOnlyOffice()
})

onBeforeUnmount(() => {
  if (editorInstance.value) {
    editorInstance.value.destroyEditor()
  }
})
</script>

<style scoped>
.template-editor-modal {
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.editor-container {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.token-item {
  animation: tokenSlide 0.2s ease-out;
}

@keyframes tokenSlide {
  from {
    transform: translateX(-10px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

#onlyoffice-editor {
  min-height: 500px;
}
</style>
