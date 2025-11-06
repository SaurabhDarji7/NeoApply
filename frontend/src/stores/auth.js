import { defineStore } from 'pinia'
import { authService } from '@/services/authService'
import router from '@/router'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('jwt_token') || null,
    isAuthenticated: !!localStorage.getItem('jwt_token'),
    loading: false,
    error: null
  }),

  getters: {
    isLoggedIn: (state) => state.isAuthenticated && !!state.token,
    currentUser: (state) => state.user
  },

  actions: {
    async register(credentials) {
      this.loading = true
      this.error = null

      try {
        const response = await authService.register(credentials)
        const data = response.data?.data

        // New flow: require email verification
        if (data?.requires_verification) {
          // Ensure no invalid token is stored
          this.clearAuth()
          // Navigate to verification page with email (code optional from URL)
          const email = data.email
          const code = data.verification_url ? new URL(data.verification_url).searchParams.get('code') : null
          router.push({
            path: '/verify-email',
            query: { email, ...(code && { code }) }
          })
          return
        }

        // Backwards compatibility if API ever returns token
        if (data?.user && data?.token) {
          this.setAuth(data.user, data.token)
          router.push('/dashboard')
        }
      } catch (error) {
        this.error = error.response?.data?.error?.message || 'Registration failed'
        throw error
      } finally {
        this.loading = false
      }
    },

    async login(credentials) {
      this.loading = true
      this.error = null

      try {
        const response = await authService.login(credentials)
        const data = response.data?.data
        this.setAuth(data.user, data.token)
        router.push('/dashboard')
      } catch (error) {
        this.error = error.response?.data?.error?.message || 'Login failed'
        throw error
      } finally {
        this.loading = false
      }
    },

    async logout() {
      this.loading = true

      try {
        await authService.logout()
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.clearAuth()
        router.push('/login')
        this.loading = false
      }
    },

    async fetchCurrentUser() {
      if (!this.token) return

      try {
        const response = await authService.getCurrentUser()
        this.user = response.data?.data
      } catch (error) {
        // Token might be expired
        this.clearAuth()
        router.push('/login')
      }
    },

    setAuth(user, token) {
      this.user = user
      this.token = token
      this.isAuthenticated = true
      localStorage.setItem('jwt_token', token)
    },

    clearAuth() {
      this.user = null
      this.token = null
      this.isAuthenticated = false
      localStorage.removeItem('jwt_token')
    }
  }
})
