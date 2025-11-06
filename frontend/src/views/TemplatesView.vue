<template>
  <div class="templates-view">
    <div class="header">
      <h1>Resume Templates</h1>
      <button @click="showUploadModal = true" class="btn-primary">
        Create New Template
      </button>
    </div>

    <!-- Templates List -->
    <div v-if="loading" class="loading">Loading templates...</div>

    <div v-else-if="templates.length === 0" class="empty-state">
      <p>No templates yet. Create your first template to get started!</p>
    </div>

    <div v-else class="templates-grid">
      <div
        v-for="template in templates"
        :key="template.id"
        class="template-card"
        @click="viewTemplate(template)"
      >
        <div class="template-header">
          <h3>{{ template.name }}</h3>
          <span :class="['status-badge', template.status]">
            {{ formatStatus(template.status) }}
          </span>
        </div>

        <div class="template-info">
          <div v-if="template.file">
            <strong>File:</strong> {{ template.file.filename }}
          </div>
          <div v-else-if="template.content_text">
            <strong>Text Input</strong>
          </div>
          <div><strong>Created:</strong> {{ formatDate(template.created_at) }}</div>
          <div v-if="template.attempt_count > 0">
            <strong>Parse Attempts:</strong> {{ template.attempt_count }}
          </div>
        </div>

        <div v-if="template.error_message" class="error-message">
          {{ template.error_message }}
        </div>

        <div class="template-actions">
          <button
            v-if="template.status === 'failed'"
            @click.stop="retryParsing(template)"
            class="btn-secondary"
          >
            Retry Parsing
          </button>
          <button
            v-if="template.status === 'completed' && template.file"
            @click.stop="downloadTemplate(template)"
            class="btn-secondary"
          >
            Download
          </button>
          <button
            v-if="template.status === 'completed'"
            @click.stop="applyJobToTemplate(template)"
            class="btn-primary"
          >
            Apply Job
          </button>
          <button
            @click.stop="deleteTemplate(template)"
            class="btn-danger"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Upload Modal -->
    <div v-if="showUploadModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Create New Template</h2>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>

        <div class="modal-body">
          <div class="input-mode-selector">
            <button
              :class="['mode-btn', { active: inputMode === 'file' }]"
              @click="inputMode = 'file'"
            >
              Upload .docx File
            </button>
            <button
              :class="['mode-btn', { active: inputMode === 'text' }]"
              @click="inputMode = 'text'"
            >
              Paste Resume Text
            </button>
          </div>

          <form @submit.prevent="createTemplate">
            <div class="form-group">
              <label for="template-name">Template Name *</label>
              <input
                id="template-name"
                v-model="newTemplate.name"
                type="text"
                required
                placeholder="e.g., My Resume 2024"
              />
            </div>

            <div v-if="inputMode === 'file'" class="form-group">
              <label for="template-file">Upload .docx File *</label>
              <input
                id="template-file"
                type="file"
                accept=".docx"
                @change="handleFileUpload"
                required
              />
              <small>Only .docx files under 10MB are allowed</small>
            </div>

            <div v-else class="form-group">
              <label for="template-text">Paste Resume Text *</label>
              <textarea
                id="template-text"
                v-model="newTemplate.content_text"
                rows="10"
                required
                placeholder="Paste your resume text here..."
              ></textarea>
            </div>

            <div v-if="uploadError" class="error-message">
              {{ uploadError }}
            </div>

            <div class="modal-actions">
              <button type="button" @click="closeModal" class="btn-secondary">
                Cancel
              </button>
              <button type="submit" :disabled="uploading" class="btn-primary">
                {{ uploading ? 'Creating...' : 'Create Template' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Apply Job Modal -->
    <div v-if="showApplyJobModal" class="modal-overlay" @click="closeApplyJobModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Apply Job Description</h2>
          <button @click="closeApplyJobModal" class="close-btn">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Select Job Description</label>
            <select v-model="selectedJobId" required>
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

          <div v-if="selectedJobId" class="available-tokens">
            <h3>Available Tokens:</h3>
            <div class="tokens-list">
              <code>{{ tokenDisplay('company_name') }}</code>
              <code>{{ tokenDisplay('title') }}</code>
              <code>{{ tokenDisplay('job_location') }}</code>
              <code>{{ tokenDisplay('job_type') }}</code>
              <code>{{ tokenDisplay('experience_level') }}</code>
              <code>{{ tokenDisplay('top_5_skills_needed') }}</code>
              <code>{{ tokenDisplay('skills_required') }}</code>
              <code>{{ tokenDisplay('responsibilities') }}</code>
              <code>{{ tokenDisplay('qualifications') }}</code>
              <code>{{ tokenDisplay('salary_range') }}</code>
            </div>
            <small>These tokens in your document will be replaced with job values</small>
          </div>

          <div class="modal-actions">
            <button @click="closeApplyJobModal" class="btn-secondary">Cancel</button>
            <button
              @click="submitApplyJob"
              :disabled="!selectedJobId || applying"
              class="btn-primary"
            >
              {{ applying ? 'Applying...' : 'Apply & Download' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Template Editor Modal -->
    <TemplateEditor
      v-if="showEditorModal && selectedTemplate"
      :template-id="selectedTemplate.id"
      @close="closeEditorModal"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import TemplateEditor from '@/components/template/TemplateEditor.vue'

export default {
  name: 'TemplatesView',
  components: {
    TemplateEditor
  },
  setup() {
    const router = useRouter()
    const templates = ref([])
    const loading = ref(true)
    const showUploadModal = ref(false)
    const showApplyJobModal = ref(false)
    const showEditorModal = ref(false)
    const inputMode = ref('file')
    const uploading = ref(false)
    const applying = ref(false)
    const uploadError = ref('')
    const selectedTemplate = ref(null)
    const selectedJobId = ref('')
    const completedJobs = ref([])

    const newTemplate = ref({
      name: '',
      content_text: '',
      file: null
    })

    const fetchTemplates = async () => {
      try {
        loading.value = true
        const response = await api.get('/templates')
        templates.value = response.data.data
      } catch (error) {
        console.error('Failed to fetch templates:', error)
        alert('Failed to load templates')
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
      }
    }

    const handleFileUpload = (event) => {
      const file = event.target.files[0]
      if (file) {
        newTemplate.value.file = file
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

        closeModal()
        fetchTemplates()
      } catch (error) {
        console.error('Template creation failed:', error)
        uploadError.value = error.response?.data?.error?.message || 'Upload failed. Only .docx files under 10MB are allowed.'
      } finally {
        uploading.value = false
      }
    }

    const retryParsing = async (template) => {
      try {
        await api.post(`/templates/${template.id}/parse`)
        alert('Parsing initiated. Please refresh in a moment.')
        fetchTemplates()
      } catch (error) {
        console.error('Retry failed:', error)
        alert('Failed to retry parsing')
      }
    }

    const downloadTemplate = (template) => {
      window.open(
        `${api.defaults.baseURL}/templates/${template.id}/download?format=docx`,
        '_blank'
      )
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

        alert('Tokens applied successfully! Downloading...')
        window.open(response.data.data.download_url, '_blank')
        closeApplyJobModal()
      } catch (error) {
        console.error('Apply job failed:', error)
        alert(error.response?.data?.error?.message || 'Failed to apply job description')
      } finally {
        applying.value = false
      }
    }

    const deleteTemplate = async (template) => {
      if (!confirm(`Delete template "${template.name}"?`)) return

      try {
        await api.delete(`/templates/${template.id}`)
        fetchTemplates()
      } catch (error) {
        console.error('Delete failed:', error)
        alert('Failed to delete template')
      }
    }

    const viewTemplate = (template) => {
      selectedTemplate.value = template
      showEditorModal.value = true
    }

    const closeEditorModal = () => {
      showEditorModal.value = false
      selectedTemplate.value = null
      // Refresh templates in case they were modified
      fetchTemplates()
    }

    const closeModal = () => {
      showUploadModal.value = false
      newTemplate.value = { name: '', content_text: '', file: null }
      uploadError.value = ''
      inputMode.value = 'file'
    }

    const closeApplyJobModal = () => {
      showApplyJobModal.value = false
      selectedTemplate.value = null
      selectedJobId.value = ''
    }

    const formatStatus = (status) => {
      return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString()
    }

    const tokenDisplay = (tokenName) => {
      return `{{${tokenName}}}`
    }

    onMounted(() => {
      fetchTemplates()
    })

    return {
      templates,
      loading,
      showUploadModal,
      showApplyJobModal,
      showEditorModal,
      inputMode,
      uploading,
      applying,
      uploadError,
      newTemplate,
      selectedTemplate,
      selectedJobId,
      completedJobs,
      fetchTemplates,
      handleFileUpload,
      createTemplate,
      retryParsing,
      downloadTemplate,
      applyJobToTemplate,
      submitApplyJob,
      deleteTemplate,
      viewTemplate,
      closeModal,
      closeApplyJobModal,
      closeEditorModal,
      formatStatus,
      formatDate,
      tokenDisplay
    }
  }
}
</script>

<style scoped>
.templates-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  margin: 0;
  font-size: 2rem;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.template-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.template-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
}

.template-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.parsing {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.completed {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.failed {
  background: #fee2e2;
  color: #991b1b;
}

.template-info {
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #666;
}

.template-info div {
  margin-bottom: 0.5rem;
}

.template-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.error-message {
  background: #fee2e2;
  color: #991b1b;
  padding: 0.75rem;
  border-radius: 4px;
  margin: 1rem 0;
  font-size: 0.875rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #ddd;
}

.modal-header h2 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 1.5rem;
}

.input-mode-selector {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.mode-btn {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn.active {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #1e40af;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input[type="text"],
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group textarea {
  resize: vertical;
  font-family: monospace;
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  color: #666;
  font-size: 0.875rem;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.available-tokens {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 4px;
}

.tokens-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0;
}

.tokens-list code {
  background: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #ddd;
  font-size: 0.875rem;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.loading,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}
</style>
