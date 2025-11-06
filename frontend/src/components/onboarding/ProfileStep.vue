<template>
  <div>
    <div class="text-center mb-8">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
      <p class="text-gray-600">
        This information will be used to auto-fill job applications. All fields are required.
      </p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6 max-w-2xl mx-auto">
      <!-- Personal Information -->
      <div class="bg-gray-50 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- First Name -->
          <div>
            <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">
              First Name <span class="text-red-500">*</span>
            </label>
            <input
              id="firstName"
              v-model="profile.first_name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="{ 'border-red-500': errors.first_name }"
              placeholder="John"
            />
            <p v-if="errors.first_name" class="mt-1 text-sm text-red-600">{{ errors.first_name }}</p>
          </div>

          <!-- Last Name -->
          <div>
            <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span class="text-red-500">*</span>
            </label>
            <input
              id="lastName"
              v-model="profile.last_name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="{ 'border-red-500': errors.last_name }"
              placeholder="Doe"
            />
            <p v-if="errors.last_name" class="mt-1 text-sm text-red-600">{{ errors.last_name }}</p>
          </div>
        </div>

        <!-- Phone Number -->
        <div class="mt-4">
          <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
            Mobile Number <span class="text-red-500">*</span>
          </label>
          <input
            id="phone"
            v-model="profile.phone"
            type="tel"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="{ 'border-red-500': errors.phone }"
            placeholder="+1 (555) 123-4567"
          />
          <p v-if="errors.phone" class="mt-1 text-sm text-red-600">{{ errors.phone }}</p>
        </div>
      </div>

      <!-- Location Information -->
      <div class="bg-gray-50 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Location</h3>

        <!-- Country -->
        <div class="mb-4">
          <label for="country" class="block text-sm font-medium text-gray-700 mb-1">
            Country <span class="text-red-500">*</span>
          </label>
          <input
            id="country"
            v-model="profile.country"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="{ 'border-red-500': errors.country }"
            placeholder="United States"
          />
          <p v-if="errors.country" class="mt-1 text-sm text-red-600">{{ errors.country }}</p>
          <p class="mt-1 text-xs text-gray-500">The country where you are applying for jobs</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- City -->
          <div>
            <label for="city" class="block text-sm font-medium text-gray-700 mb-1">
              City <span class="text-red-500">*</span>
            </label>
            <input
              id="city"
              v-model="profile.city"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="{ 'border-red-500': errors.city }"
              placeholder="New York"
            />
            <p v-if="errors.city" class="mt-1 text-sm text-red-600">{{ errors.city }}</p>
          </div>

          <!-- State/Region -->
          <div>
            <label for="state" class="block text-sm font-medium text-gray-700 mb-1">
              State/Region <span class="text-red-500">*</span>
            </label>
            <input
              id="state"
              v-model="profile.state"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="{ 'border-red-500': errors.state }"
              placeholder="NY"
            />
            <p v-if="errors.state" class="mt-1 text-sm text-red-600">{{ errors.state }}</p>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
          <p class="text-sm text-red-800">{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Info Box -->
      <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div class="flex">
          <svg class="w-5 h-5 text-blue-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clip-rule="evenodd"
            />
          </svg>
          <p class="text-sm text-blue-800">
            Your information is securely stored and will only be used to help you apply for jobs faster.
          </p>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
export default {
  name: 'ProfileStep',
  props: {
    initialProfile: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      profile: {
        first_name: '',
        last_name: '',
        phone: '',
        country: '',
        city: '',
        state: ''
      },
      errors: {},
      errorMessage: ''
    }
  },
  watch: {
    initialProfile: {
      immediate: true,
      handler(value) {
        if (value) {
          this.profile = { ...this.profile, ...value }
        }
      }
    },
    profile: {
      deep: true,
      handler() {
        this.validateForm()
        this.$emit('update', this.profile)
      }
    }
  },
  methods: {
    validateForm() {
      this.errors = {}
      this.errorMessage = ''

      if (!this.profile.first_name?.trim()) {
        this.errors.first_name = 'First name is required'
      }

      if (!this.profile.last_name?.trim()) {
        this.errors.last_name = 'Last name is required'
      }

      if (!this.profile.phone?.trim()) {
        this.errors.phone = 'Mobile number is required'
      }

      if (!this.profile.country?.trim()) {
        this.errors.country = 'Country is required'
      }

      if (!this.profile.city?.trim()) {
        this.errors.city = 'City is required'
      }

      if (!this.profile.state?.trim()) {
        this.errors.state = 'State/Region is required'
      }

      const isValid = Object.keys(this.errors).length === 0
      this.$emit('valid', isValid)
      return isValid
    },
    handleSubmit() {
      if (this.validateForm()) {
        this.$emit('submit', this.profile)
      }
    }
  },
  emits: ['update', 'valid', 'submit']
}
</script>
