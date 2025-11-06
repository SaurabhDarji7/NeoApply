import api from './api'

const jobDescriptionService = {
  // Get all job descriptions
  getAll(params = {}) {
    return api.get('/job_descriptions', { params })
  },

  // Get single job description
  getById(id) {
    return api.get(`/job_descriptions/${id}`)
  },

  // Create job description (with URL or raw text)
  create(data) {
    return api.post('/job_descriptions', { job_description: data })
  },

  // Delete job description
  delete(id) {
    return api.delete(`/job_descriptions/${id}`)
  },

  // Get job description status
  getStatus(id) {
    return api.get(`/job_descriptions/${id}/status`)
  }
}

export default jobDescriptionService
