import api from './api'

export const autofillProfileService = {
  getProfile() {
    return api.get('/extension/autofill_profile')
  },

  updateProfile(data) {
    return api.put('/extension/autofill_profile', { autofill_profile: data })
  }
}
