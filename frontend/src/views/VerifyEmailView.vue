<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">Verify your email</h2>
        <p class="mt-2 text-sm text-gray-600">
          We've sent a 6-digit verification code to <strong>{{ email }}</strong>
        </p>
      </div>

      <form @submit.prevent="verifyOTP" class="mt-8 space-y-6">
        <div v-if="error" class="rounded-md bg-red-50 p-4">
          <div class="flex">
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Verification failed</h3>
              <div class="mt-2 text-sm text-red-700">
                <p>{{ error }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="successMessage" class="rounded-md bg-green-50 p-4">
          <div class="flex">
            <div class="ml-3">
              <h3 class="text-sm font-medium text-green-800">Success!</h3>
              <div class="mt-2 text-sm text-green-700">
                <p>{{ successMessage }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="otp" class="sr-only">Verification code</label>
            <input
              id="otp"
              v-model="otp"
              type="text"
              maxlength="6"
              pattern="[0-9]{6}"
              required
              class="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 text-center text-2xl tracking-widest focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-3xl"
              placeholder="000000"
              :disabled="loading"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading || otp.length !== 6"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <span v-if="loading" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              Verifying...
            </span>
            <span v-else>Verify Email</span>
          </button>
        </div>

        <div class="text-center">
          <button
            type="button"
            @click="resendOTP"
            :disabled="loading || resendCooldown > 0"
            class="text-sm text-blue-600 hover:text-blue-500 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <span v-if="resendCooldown > 0">Resend code in {{ resendCooldown }}s</span>
            <span v-else>Didn't receive the code? Resend</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()
const email = ref(route.query.email || '')
const otp = ref(route.query.code || '')
const error = ref('')
const successMessage = ref('')
const loading = ref(false)
const resendCooldown = ref(0)

// Auto-submit if code is provided in URL
onMounted(async () => {
  if (!email.value) {
    error.value = 'Missing email address. Please register again.'
    return
  }

  // If code is pre-filled from URL, auto-verify
  if (otp.value && otp.value.length === 6) {
    await verifyOTP()
  }
})

async function verifyOTP() {
  if (!email.value || otp.value.length !== 6) return

  loading.value = true
  error.value = ''
  successMessage.value = ''

  try {
    const resp = await api.post('/auth/verify_otp', {
      user: { email: email.value, otp: otp.value }
    })

    successMessage.value = 'Email verified successfully! Redirecting to login...'

    // Redirect to login page after 2 seconds
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (e) {
    error.value = e.response?.data?.error?.message || 'Invalid or expired verification code.'
    otp.value = '' // Clear the input on error
  } finally {
    loading.value = false
  }
}

async function resendOTP() {
  if (!email.value || resendCooldown.value > 0) return

  loading.value = true
  error.value = ''
  successMessage.value = ''

  try {
    await api.post('/auth/resend_otp', {
      user: { email: email.value }
    })

    successMessage.value = 'New verification code sent! Check your email.'

    // Start 60-second cooldown
    resendCooldown.value = 60
    const interval = setInterval(() => {
      resendCooldown.value--
      if (resendCooldown.value <= 0) {
        clearInterval(interval)
      }
    }, 1000)
  } catch (e) {
    error.value = e.response?.data?.error?.message || 'Failed to resend code.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type=number] {
  -moz-appearance: textfield;
}
</style>
