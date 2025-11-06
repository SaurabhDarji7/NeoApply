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
              class="input"
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
              class="input"
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
            class="input"
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
            class="input"
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
              class="input"
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
              class="input"
              :class="{ 'border-red-500': errors.state }"
              placeholder="NY"
            />
            <p v-if="errors.state" class="mt-1 text-sm text-red-600">{{ errors.state }}</p>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <Alert type="error" :message="errorMessage" />

      <!-- Info Box -->
      <Alert type="info" message="Your information is securely stored and will only be used to help you apply for jobs faster." />
    </form>
  </div>
</template>

<script>
import Alert from '@/components/common/Alert.vue'

export default {
  name: 'ProfileStep',
  components: {
    Alert
  },
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
