<template>
  <WizardContainer
    :current-step="currentStep"
    :total-steps="totalSteps"
    :can-proceed="canProceed && !saving"
    :show-skip="showSkip"
    @next="handleNext"
    @prev="handlePrev"
    @skip="handleSkip"
    @complete="handleComplete"
  >
    <!-- Global Error Display -->
    <Alert v-if="error" type="error" :message="error" class="mb-6" />

    <!-- Step 1: Welcome -->
    <WelcomeStep v-if="currentStep === 1" />

    <!-- Step 2: Profile -->
    <ProfileStep
      v-if="currentStep === 2"
      :initial-profile="profile"
      @update="handleProfileUpdate"
      @valid="handleProfileValidation"
    />

    <!-- Step 3: Resume Upload (Optional) -->
    <ResumeStep
      v-if="currentStep === 3"
      @resume-uploaded="handleResumeUploaded"
      @resume-parsed="handleResumeParsed"
    />

    <!-- Step 4: Completion -->
    <CompletionStep
      v-if="currentStep === 4"
      :has-resume="hasUploadedResume"
    />
  </WizardContainer>
</template>

<script>
import { useAuthStore } from '@/stores/auth'
import { autofillProfileService } from '@/services/autofillProfileService'
import WizardContainer from '@/components/onboarding/WizardContainer.vue'
import WelcomeStep from '@/components/onboarding/WelcomeStep.vue'
import ProfileStep from '@/components/onboarding/ProfileStep.vue'
import ResumeStep from '@/components/onboarding/ResumeStep.vue'
import CompletionStep from '@/components/onboarding/CompletionStep.vue'
import Alert from '@/components/common/Alert.vue'

export default {
  name: 'OnboardingView',
  components: {
    WizardContainer,
    WelcomeStep,
    ProfileStep,
    ResumeStep,
    CompletionStep,
    Alert
  },
  data() {
    return {
      currentStep: 1,
      totalSteps: 4,
      profile: {
        first_name: '',
        last_name: '',
        phone: '',
        country: '',
        city: '',
        state: ''
      },
      profileValid: false,
      hasUploadedResume: false,
      resumeId: null,
      saving: false,
      error: null
    }
  },
  computed: {
    canProceed() {
      switch (this.currentStep) {
        case 1: // Welcome - always can proceed
          return true
        case 2: // Profile - must be valid
          return this.profileValid
        case 3: // Resume - optional, always can proceed
          return true
        case 4: // Completion - always can proceed
          return true
        default:
          return false
      }
    },
    showSkip() {
      // Only show skip on resume step (step 3)
      return this.currentStep === 3
    }
  },
  async mounted() {
    const authStore = useAuthStore()

    // If already completed onboarding, redirect to dashboard
    if (authStore.user?.onboarding_completed) {
      this.$router.push('/dashboard')
      return
    }

    // Load existing profile if available
    await this.loadProfile()

    // Resume from saved step
    if (authStore.user?.onboarding_current_step) {
      this.currentStep = authStore.user.onboarding_current_step
    }

    // Check if user has already uploaded a resume
    this.hasUploadedResume = authStore.hasUploadedResume
  },
  methods: {
    async loadProfile() {
      try {
        const response = await autofillProfileService.getProfile()
        const data = response.data?.data

        if (data) {
          this.profile = {
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            phone: data.phone || '',
            country: data.country || '',
            city: data.city || '',
            state: data.state || ''
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      }
    },
    handleProfileUpdate(updatedProfile) {
      this.profile = { ...this.profile, ...updatedProfile }
    },
    handleProfileValidation(isValid) {
      this.profileValid = isValid
    },
    handleResumeUploaded(resumeId) {
      this.resumeId = resumeId
    },
    handleResumeParsed(resumeData) {
      this.hasUploadedResume = true
    },
    async handleNext() {
      // Save progress before moving to next step
      if (this.currentStep === 2) {
        // Save profile data
        await this.saveProfile()
      }

      this.currentStep++
      await this.saveProgress()
    },
    async handlePrev() {
      this.currentStep--
      await this.saveProgress()
    },
    async handleSkip() {
      // Skip resume upload step
      if (this.currentStep === 3) {
        this.currentStep++
        await this.saveProgress()
      }
    },
    async saveProfile() {
      this.saving = true
      this.error = null

      try {
        // Include email from auth store
        const authStore = useAuthStore()
        const profileData = {
          ...this.profile,
          email: authStore.user?.email
        }

        await autofillProfileService.updateProfile(profileData)
      } catch (error) {
        this.error = error.response?.data?.error?.message || 'Failed to save profile'
        throw error
      } finally {
        this.saving = false
      }
    },
    async saveProgress() {
      const authStore = useAuthStore()
      try {
        await authStore.updateOnboardingStep(this.currentStep)
      } catch (error) {
        console.error('Failed to save progress:', error)
      }
    },
    async handleComplete() {
      const authStore = useAuthStore()

      try {
        await authStore.completeOnboarding()

        // Show success message briefly before redirect
        setTimeout(() => {
          this.$router.push('/dashboard')
        }, 1000)
      } catch (error) {
        this.error = 'Failed to complete onboarding. Please try again.'
        console.error('Onboarding completion error:', error)
      }
    }
  }
}
</script>
