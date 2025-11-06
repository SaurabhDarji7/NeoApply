import api from './api'

const templateService = {
  // Get OnlyOffice editor configuration
  getEditorConfig(templateId) {
    return api.get(`/templates/${templateId}/editor_config`)
  },

  // Get template with file URL
  getTemplate(templateId) {
    return api.get(`/templates/${templateId}`)
  },

  // Apply job description tokens and get processed document
  applyJobTokens(templateId, jobId, options = {}) {
    return api.post(`/templates/${templateId}/apply_job`, {
      job_id: jobId,
      bold_tokens: options.boldTokens,
      highlight_skills: options.highlightSkills
    })
  },

  // Export template as PDF
  exportPdf(templateId) {
    return api.post(`/templates/${templateId}/export_pdf`)
  },

  // Get download URL
  getDownloadUrl(templateId) {
    return `${import.meta.env.VITE_API_BASE_URL}/templates/${templateId}/download`
  }
}

export default templateService
