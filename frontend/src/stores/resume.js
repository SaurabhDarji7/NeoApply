import { defineStore } from 'pinia'
import resumeService from '@/services/resumeService'

export const useResumeStore = defineStore('resume', {
  state: () => ({
    resumes: [],
    currentResume: null,
    loading: false,
    error: null,
    pollingIntervals: {} // Track active polling intervals by resume ID
  }),

  getters: {
    // Get resumes by status
    resumesByStatus: (state) => (status) => {
      return state.resumes.filter(resume => resume.status === status)
    },

    // Get count by status
    statusCount: (state) => (status) => {
      return state.resumes.filter(resume => resume.status === status).length
    },

    // Check if any resumes are processing
    hasProcessing: (state) => {
      return state.resumes.some(resume => resume.status === 'processing')
    }
  },

  actions: {
    // Fetch all resumes
    async fetchResumes(params = {}) {
      this.loading = true
      this.error = null

      try {
        const response = await resumeService.getAll(params)
        this.resumes = response.data
        return response
      } catch (error) {
        this.error = error.response?.data?.error?.message || 'Failed to fetch resumes'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Fetch single resume
    async fetchResume(id) {
      this.loading = true
      this.error = null

      try {
        const response = await resumeService.getById(id)
        this.currentResume = response.data
        return response
      } catch (error) {
        this.error = error.response?.data?.error?.message || 'Failed to fetch resume'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Upload new resume
    async uploadResume(file, name) {
      this.loading = true
      this.error = null

      try {
        const formData = new FormData()
        formData.append('resume[file]', file)
        formData.append('resume[name]', name)

        const response = await resumeService.upload(formData)

        // Add new resume to the list
        this.resumes.unshift(response.data)

        return response
      } catch (error) {
        this.error = error.response?.data?.error?.message || 'Failed to upload resume'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Delete resume
    async deleteResume(id) {
      this.loading = true
      this.error = null

      try {
        await resumeService.delete(id)

        // Remove from list
        this.resumes = this.resumes.filter(resume => resume.id !== id)

        // Clear current if it was deleted
        if (this.currentResume?.id === id) {
          this.currentResume = null
        }
      } catch (error) {
        this.error = error.response?.data?.error?.message || 'Failed to delete resume'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Check status of a resume
    async checkStatus(id) {
      try {
        const response = await resumeService.getStatus(id)

        // Update the resume in the list
        const index = this.resumes.findIndex(resume => resume.id === id)
        if (index !== -1) {
          this.resumes[index] = { ...this.resumes[index], ...response.data }
        }

        // Update current resume if it matches
        if (this.currentResume?.id === id) {
          this.currentResume = { ...this.currentResume, ...response.data }
        }

        return response
      } catch (error) {
        console.error('Failed to check resume status:', error)
        throw error
      }
    },

    // Poll resume status (for background processing)
    async pollResumeStatus(id) {
      // Don't start polling if already polling this resume
      if (this.pollingIntervals[id]) {
        return
      }

      const poll = async () => {
        try {
          const response = await resumeService.getStatus(id)

          // Update the resume in the list
          const index = this.resumes.findIndex(resume => resume.id === id)
          if (index !== -1) {
            this.resumes[index] = { ...this.resumes[index], status: response.data.status, error_message: response.data.error_message }
          }

          // Update current resume if it matches
          if (this.currentResume?.id === id) {
            this.currentResume = { ...this.currentResume, status: response.data.status, error_message: response.data.error_message }
          }

          // Stop polling if status is completed or failed
          if (response.data.status === 'completed' || response.data.status === 'failed') {
            this.stopPolling(id)
            // Refresh the full resume data to get parsed_data
            await this.fetchResume(id)
          }
        } catch (error) {
          console.error('Polling error:', error)
          // Stop polling on error
          this.stopPolling(id)
        }
      }

      // Start polling every 2 seconds
      this.pollingIntervals[id] = setInterval(poll, 2000)

      // Do an immediate poll
      poll()
    },

    // Stop polling for a specific resume
    stopPolling(id) {
      if (this.pollingIntervals[id]) {
        clearInterval(this.pollingIntervals[id])
        delete this.pollingIntervals[id]
      }
    },

    // Stop all polling
    stopAllPolling() {
      Object.keys(this.pollingIntervals).forEach(id => {
        this.stopPolling(id)
      })
    },

    // Clear error
    clearError() {
      this.error = null
    }
  }
})
