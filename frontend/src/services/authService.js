import api from './api'

export const authService = {
  register(credentials) {
    return api.post('/auth/register', { user: credentials })
  },

  login(credentials) {
    return api.post('/auth/login', { user: credentials })
  },

  logout() {
    return api.delete('/auth/logout')
  },

  getCurrentUser() {
    return api.get('/users/me')
  },

  updateProfile(data) {
    return api.put('/users/me', { user: data })
  },

  updateOnboardingStep(step) {
    return api.patch('/users/onboarding/step', { step })
  },

  completeOnboarding() {
    return api.post('/users/onboarding/complete')
  }
}
