<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to NeoApply
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Or
          <router-link to="/register" class="font-medium text-primary hover:text-blue-500">
            create a new account
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
                aria-describedby="email-error"
              />
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
                autocomplete="current-password"
                required
                class="input focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
                aria-describedby="password-error"
              />
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember-me"
                v-model="form.rememberMe"
                name="remember-me"
                type="checkbox"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
              />
              <label for="remember-me" class="ml-2 block text-sm text-gray-900 cursor-pointer">
                Keep me signed in
              </label>
            </div>

            <div class="text-sm">
              <a href="#" class="font-medium text-blue-600 hover:text-blue-500">
                Forgot password?
              </a>
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
                <p v-if="errorHint" class="text-sm text-red-700 mt-1">
                  {{ errorHint }}
                </p>
              </div>
            </div>
          </div>

          <div>
            <BaseButton
              type="submit"
              :loading="loading"
              loading-text="Signing in..."
              full-width
              size="lg"
              aria-label="Sign in to your account"
            >
              Sign in
            </BaseButton>
          </div>
        </form>
      </BaseCard>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'

const authStore = useAuthStore()
const toast = useToast()

const form = ref({
  email: '',
  password: '',
  rememberMe: false
})

const loading = ref(false)
const error = ref(null)
const errorHint = ref(null)

// Load remembered email if exists
onMounted(() => {
  const rememberedEmail = localStorage.getItem('rememberedEmail')
  if (rememberedEmail) {
    form.value.email = rememberedEmail
    form.value.rememberMe = true
  }
})

const handleSubmit = async () => {
  loading.value = true
  error.value = null
  errorHint.value = null

  try {
    await authStore.login({
      email: form.value.email,
      password: form.value.password
    })

    // Handle remember me
    if (form.value.rememberMe) {
      localStorage.setItem('rememberedEmail', form.value.email)
    } else {
      localStorage.removeItem('rememberedEmail')
    }

    toast.success(
      'Welcome back!',
      'You have successfully signed in.'
    )
  } catch (err) {
    const errorMessage = err.response?.data?.error?.message || 'Login failed. Please try again.'

    // Provide specific error messages
    if (errorMessage.toLowerCase().includes('password')) {
      error.value = 'Incorrect password'
      errorHint.value = 'Please check your password and try again.'
    } else if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('user')) {
      error.value = 'No account found with this email'
      errorHint.value = 'Please check your email or create a new account.'
    } else if (errorMessage.toLowerCase().includes('verified')) {
      error.value = 'Email not verified'
      errorHint.value = 'Please check your email and verify your account before signing in.'
    } else {
      error.value = errorMessage
    }

    toast.error(
      'Sign in failed',
      error.value
    )
  } finally {
    loading.value = false
  }
}
</script>
