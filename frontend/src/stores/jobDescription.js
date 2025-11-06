import { defineStore } from 'pinia'
import jobDescriptionService from '@/services/jobDescriptionService'

export const useJobDescriptionStore = defineStore('jobDescription', {
  state: () => ({
    jobDescriptions: [],
    currentJobDescription: null,
    loading: false,
    error: null,
    pollingIntervals: {} // Track active polling intervals by job ID
  }),

  getters: {
    // Get job descriptions by status
    jobsByStatus: (state) => (status) => {
      return state.jobDescriptions.filter(job => job.status === status)
    },

    // Get count by status
    statusCount: (state) => (status) => {
      return state.jobDescriptions.filter(job => job.status === status).length
    },

    // Check if any jobs are processing
    hasProcessing: (state) => {
      return state.jobDescriptions.some(job => ['scraping', 'parsing'].includes(job.status))
    }
  },

  actions: {
    // Fetch all job descriptions
    async fetchJobDescriptions(params = {}) {
      this.loading = true
      this.error = null

      try {
        const response = await jobDescriptionService.getAll(params)
        this.jobDescriptions = response.data.data || response.data
        return response
      } catch (error) {
        this.error = error.response?.data?.error?.message || 'Failed to fetch job descriptions'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Fetch single job description
    async fetchJobDescription(id) {
      this.loading = true
      this.error = null

      try {
        const response = await jobDescriptionService.getById(id)
        this.currentJobDescription = response.data.data || response.data
        return response
      } catch (error) {
        this.error = error.response?.data?.error?.message || 'Failed to fetch job description'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Create new job description (with URL or raw text)
    async createJobDescription(data) {
      this.loading = true
      this.error = null

      try {
        const response = await jobDescriptionService.create(data)
        const jobData = response.data.data || response.data

        // Add new job to the list
        this.jobDescriptions.unshift(jobData)

        // Start polling for this job
        this.pollJobStatus(jobData.id)

        return response
      } catch (error) {
        this.error = error.response?.data?.error?.message || 'Failed to create job description'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Delete job description
    async deleteJobDescription(id) {
      this.loading = true
      this.error = null

      try {
        await jobDescriptionService.delete(id)

        // Stop polling if active
        this.stopPolling(id)

        // Remove from list
        this.jobDescriptions = this.jobDescriptions.filter(job => job.id !== id)

        // Clear current if it was deleted
        if (this.currentJobDescription?.id === id) {
          this.currentJobDescription = null
        }
      } catch (error) {
        this.error = error.response?.data?.error?.message || 'Failed to delete job description'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Check status of a job description
    async checkStatus(id) {
      try {
        const response = await jobDescriptionService.getStatus(id)
        const statusData = response.data.data || response.data

        // Update the job in the list
        const index = this.jobDescriptions.findIndex(job => job.id === id)
        if (index !== -1) {
          this.jobDescriptions[index] = { ...this.jobDescriptions[index], ...statusData }
        }

        // Update current job if it matches
        if (this.currentJobDescription?.id === id) {
          this.currentJobDescription = { ...this.currentJobDescription, ...statusData }
        }

        return response
      } catch (error) {
        console.error('Failed to check job description status:', error)
        throw error
      }
    },

    // Poll job description status (for background processing)
    async pollJobStatus(id) {
      // Don't start polling if already polling this job
      if (this.pollingIntervals[id]) {
        return
      }

      const poll = async () => {
        try {
          const response = await jobDescriptionService.getStatus(id)
          const statusData = response.data.data || response.data

          // Update the job in the list
          const index = this.jobDescriptions.findIndex(job => job.id === id)
          if (index !== -1) {
            this.jobDescriptions[index] = { ...this.jobDescriptions[index], status: statusData.status, error_message: statusData.error_message }
          }

          // Update current job if it matches
          if (this.currentJobDescription?.id === id) {
            this.currentJobDescription = { ...this.currentJobDescription, status: statusData.status, error_message: statusData.error_message }
          }

          // Stop polling if status is completed or failed
          if (statusData.status === 'completed' || statusData.status === 'failed') {
            this.stopPolling(id)
            // Refresh the full job data to get parsed attributes
            await this.fetchJobDescription(id)
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

    // Stop polling for a specific job
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
