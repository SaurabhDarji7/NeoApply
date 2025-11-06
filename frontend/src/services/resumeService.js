import api from './api'

export default {
  // Get all resumes for current user
  async getAll(params = {}) {
    const response = await api.get('/resumes', { params })
    return response.data
  },

  // Get single resume by ID
  async getById(id) {
    const response = await api.get(`/resumes/${id}`)
    return response.data
  },

  // Upload new resume
  async upload(formData) {
    const response = await api.post('/resumes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // Delete resume
  async delete(id) {
    const response = await api.delete(`/resumes/${id}`)
    return response.data
  },

  // Get resume status
  async getStatus(id) {
    const response = await api.get(`/resumes/${id}/status`)
    return response.data
  },

  // Download resume file
  getDownloadUrl(id) {
    return `${import.meta.env.VITE_API_BASE_URL}/resumes/${id}/download`
  }
}
