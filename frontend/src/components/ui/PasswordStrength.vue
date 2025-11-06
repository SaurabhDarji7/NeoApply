<template>
  <div class="mt-2">
    <!-- Strength Bar -->
    <div class="flex gap-1 mb-2">
      <div
        v-for="i in 4"
        :key="i"
        class="h-1 flex-1 rounded-full transition-colors duration-300"
        :class="getBarColor(i)"
      ></div>
    </div>

    <!-- Strength Label -->
    <div class="flex items-center justify-between mb-3">
      <span class="text-xs font-medium" :class="strengthColor">
        {{ strengthText }}
      </span>
      <span class="text-xs text-gray-500">
        {{ password.length }}/{{ minLength }} characters
      </span>
    </div>

    <!-- Requirements Checklist -->
    <div class="space-y-1.5">
      <div
        v-for="requirement in requirements"
        :key="requirement.label"
        class="flex items-center text-xs"
      >
        <svg
          v-if="requirement.met"
          class="h-4 w-4 text-green-500 mr-2"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd"
          />
        </svg>
        <svg
          v-else
          class="h-4 w-4 text-gray-400 mr-2"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd"
          />
        </svg>
        <span :class="requirement.met ? 'text-gray-700' : 'text-gray-500'">
          {{ requirement.label }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  password: {
    type: String,
    required: true
  },
  minLength: {
    type: Number,
    default: 8
  }
})

const hasMinLength = computed(() => props.password.length >= props.minLength)
const hasLowerCase = computed(() => /[a-z]/.test(props.password))
const hasUpperCase = computed(() => /[A-Z]/.test(props.password))
const hasNumber = computed(() => /\d/.test(props.password))
const hasSpecialChar = computed(() => /[!@#$%^&*(),.?":{}|<>]/.test(props.password))

const requirements = computed(() => [
  { label: `At least ${props.minLength} characters`, met: hasMinLength.value },
  { label: 'One lowercase letter', met: hasLowerCase.value },
  { label: 'One uppercase letter', met: hasUpperCase.value },
  { label: 'One number', met: hasNumber.value },
  { label: 'One special character', met: hasSpecialChar.value }
])

const strength = computed(() => {
  if (!props.password) return 0

  let score = 0
  if (hasMinLength.value) score++
  if (hasLowerCase.value) score++
  if (hasUpperCase.value) score++
  if (hasNumber.value) score++
  if (hasSpecialChar.value) score++

  return score
})

const strengthText = computed(() => {
  if (strength.value === 0) return 'No password'
  if (strength.value <= 2) return 'Weak'
  if (strength.value === 3) return 'Fair'
  if (strength.value === 4) return 'Good'
  return 'Strong'
})

const strengthColor = computed(() => {
  if (strength.value === 0) return 'text-gray-500'
  if (strength.value <= 2) return 'text-red-600'
  if (strength.value === 3) return 'text-yellow-600'
  if (strength.value === 4) return 'text-blue-600'
  return 'text-green-600'
})

const getBarColor = (index) => {
  if (index <= strength.value) {
    if (strength.value <= 2) return 'bg-red-500'
    if (strength.value === 3) return 'bg-yellow-500'
    if (strength.value === 4) return 'bg-blue-500'
    return 'bg-green-500'
  }
  return 'bg-gray-200'
}
</script>
