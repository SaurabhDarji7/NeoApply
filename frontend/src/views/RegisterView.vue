<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Or
          <router-link to="/login" class="font-medium text-primary hover:text-blue-500">
            sign in to existing account
          </router-link>
        </p>
      </div>

      <BaseCard padding="lg">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <div class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                v-model="form.email"
                name="email"
                type="email"
                autocomplete="email"
                required
                class="input focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="your.email@example.com"
                @blur="validateEmail"
                aria-describedby="email-error"
              />
              <p v-if="emailError" id="email-error" class="mt-1 text-sm text-red-600" role="alert">
                {{ emailError }}
              </p>
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                v-model="form.password"
                name="password"
                type="password"
                autocomplete="new-password"
                required
                class="input focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Create a strong password"
                aria-describedby="password-strength"
              />

              <!-- Password Strength Indicator -->
              <PasswordStrength
                v-if="form.password"
                :password="form.password"
                :min-length="8"
                id="password-strength"
              />
            </div>

            <div>
              <label for="password-confirmation" class="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="password-confirmation"
                v-model="form.password_confirmation"
                name="password_confirmation"
                type="password"
                autocomplete="new-password"
                required
                class="input focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Re-enter your password"
                @blur="validatePasswordMatch"
                aria-describedby="password-match-error"
              />
              <p v-if="passwordMatchError" id="password-match-error" class="mt-1 text-sm text-red-600" role="alert">
                {{ passwordMatchError }}
              </p>
            </div>
          </div>

          <div v-if="error" class="rounded-md bg-red-50 p-4" role="alert" aria-live="assertive">
            <div class="flex">
              <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">
                  {{ error }}
                </h3>
                <div v-if="validationErrors" class="mt-2 text-sm text-red-700">
                  <ul class="list-disc pl-5 space-y-1">
                    <li v-for="(messages, field) in validationErrors" :key="field">
                      {{ field }}: {{ messages.join(', ') }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div>
            <BaseButton
              type="submit"
              :loading="loading"
              loading-text="Creating account..."
              full-width
              size="lg"
              aria-label="Create your account"
            >
              Create account
            </BaseButton>
          </div>
        </form>
      </BaseCard>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import PasswordStrength from '@/components/ui/PasswordStrength.vue'

const authStore = useAuthStore()
const toast = useToast()

const form = ref({
  email: '',
  password: '',
  password_confirmation: ''
})

const loading = ref(false)
const error = ref(null)
const validationErrors = ref(null)
const emailError = ref(null)
const passwordMatchError = ref(null)

const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (form.value.email && !emailRegex.test(form.value.email)) {
    emailError.value = 'Please enter a valid email address'
  } else {
    emailError.value = null
  }
}

const validatePasswordMatch = () => {
  if (form.value.password_confirmation && form.value.password !== form.value.password_confirmation) {
    passwordMatchError.value = 'Passwords do not match'
  } else {
    passwordMatchError.value = null
  }
}

const handleSubmit = async () => {
  loading.value = true
  error.value = null
  validationErrors.value = null

  // Client-side validation
  validateEmail()
  validatePasswordMatch()

  if (emailError.value || passwordMatchError.value) {
    loading.value = false
    return
  }

  if (form.value.password !== form.value.password_confirmation) {
    error.value = 'Passwords do not match'
    loading.value = false
    return
  }

  if (form.value.password.length < 8) {
    error.value = 'Password must be at least 8 characters long'
    loading.value = false
    return
  }

  try {
    await authStore.register({
      email: form.value.email,
      password: form.value.password,
      password_confirmation: form.value.password_confirmation
    })

    toast.success(
      'Account created successfully!',
      'Please check your email to verify your account.'
    )
  } catch (err) {
    error.value = err.response?.data?.error?.message || 'Registration failed. Please try again.'
    validationErrors.value = err.response?.data?.error?.details

    toast.error(
      'Registration failed',
      error.value
    )
  } finally {
    loading.value = false
  }
}
</script>
