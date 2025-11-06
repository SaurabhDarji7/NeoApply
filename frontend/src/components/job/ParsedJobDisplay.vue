<template>
  <div v-if="attributes" class="parsed-job-display">
    <!-- Job Header -->
    <section class="mb-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-8 text-white">
      <h1 class="text-3xl font-bold mb-2">{{ attributes.title || 'Job Title' }}</h1>
      <p class="text-xl mb-4">{{ attributes.company || 'Company Name' }}</p>
      <div class="flex flex-wrap gap-4 text-sm">
        <span v-if="attributes.location" class="flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {{ attributes.location }}
        </span>
        <span v-if="attributes.remote_type" class="flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          {{ attributes.remote_type }}
        </span>
        <span v-if="attributes.job_type" class="flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {{ attributes.job_type }}
        </span>
        <span v-if="attributes.experience_level">
          {{ attributes.experience_level }} Level
        </span>
      </div>
    </section>

    <!-- Salary Range -->
    <section v-if="attributes.salary_range" class="mb-8 bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Salary Range</h2>
      <p class="text-xl font-semibold text-green-600">
        {{ formatSalary(attributes.salary_range) }}
      </p>
    </section>

    <!-- Required Skills -->
    <section v-if="attributes.skills_required && attributes.skills_required.length > 0" class="mb-8 bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Required Skills</h2>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="skill in attributes.skills_required"
          :key="skill.name"
          :class="[
            'px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1',
            skill.importance === 'Required' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
          ]"
        >
          <span v-if="skill.importance === 'Required'" class="font-bold">★</span>
          {{ skill.name }}
          <span v-if="skill.importance === 'Required'" class="text-xs">(Required)</span>
        </span>
      </div>
    </section>

    <!-- Nice to Have Skills -->
    <section v-if="attributes.skills_nice_to_have && attributes.skills_nice_to_have.length > 0" class="mb-8 bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Nice to Have Skills</h2>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="skill in attributes.skills_nice_to_have"
          :key="skill"
          class="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700 flex items-center gap-1"
        >
          <span class="text-xs">✨</span>
          {{ skill }}
          <span class="text-xs">(Bonus)</span>
        </span>
      </div>
    </section>

    <!-- Responsibilities -->
    <section v-if="attributes.responsibilities && attributes.responsibilities.length > 0" class="mb-8 bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Responsibilities</h2>
      <ul class="space-y-2">
        <li
          v-for="(resp, index) in attributes.responsibilities"
          :key="index"
          class="flex items-start gap-2"
        >
          <span class="text-blue-600 mt-1">•</span>
          <span class="text-gray-700">{{ resp }}</span>
        </li>
      </ul>
    </section>

    <!-- Qualifications -->
    <section v-if="attributes.qualifications && attributes.qualifications.length > 0" class="mb-8 bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Qualifications</h2>
      <ul class="space-y-2">
        <li
          v-for="(qual, index) in attributes.qualifications"
          :key="index"
          class="flex items-start gap-2"
        >
          <span class="text-green-600 mt-1">✓</span>
          <span class="text-gray-700">{{ qual }}</span>
        </li>
      </ul>
    </section>

    <!-- Benefits -->
    <section v-if="attributes.benefits && attributes.benefits.length > 0" class="mb-8 bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Benefits</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          v-for="(benefit, index) in attributes.benefits"
          :key="index"
          class="flex items-center gap-2 text-gray-700"
        >
          <span class="text-purple-600">🎁</span>
          {{ benefit }}
        </div>
      </div>
    </section>

    <!-- Additional Information -->
    <section class="mb-8 bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Additional Information</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-if="attributes.years_of_experience">
          <span class="text-sm font-medium text-gray-500">Years of Experience</span>
          <p class="text-base text-gray-900">{{ attributes.years_of_experience }}</p>
        </div>
        <div v-if="attributes.education_requirement">
          <span class="text-sm font-medium text-gray-500">Education Requirement</span>
          <p class="text-base text-gray-900">{{ attributes.education_requirement }}</p>
        </div>
        <div v-if="attributes.industry">
          <span class="text-sm font-medium text-gray-500">Industry</span>
          <p class="text-base text-gray-900">{{ attributes.industry }}</p>
        </div>
        <div v-if="attributes.visa_sponsorship !== null">
          <span class="text-sm font-medium text-gray-500">Visa Sponsorship</span>
          <p class="text-base" :class="attributes.visa_sponsorship ? 'text-green-600' : 'text-gray-600'">
            {{ attributes.visa_sponsorship ? 'Available' : 'Not Available' }}
          </p>
        </div>
        <div v-if="attributes.requires_bilingual !== null">
          <span class="text-sm font-medium text-gray-500">Bilingual Requirement</span>
          <p class="text-base text-gray-900">
            {{ attributes.requires_bilingual ? 'Yes' : 'No' }}
            <span v-if="attributes.languages_required && attributes.languages_required.length > 0">
              ({{ attributes.languages_required.join(', ') }})
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Match Score Placeholder -->
    <section class="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow p-6 border-2 border-dashed border-purple-300">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Match Score</h2>
      <p class="text-gray-600">Coming soon: See how well your resume matches this job!</p>
    </section>
  </div>

  <div v-else class="bg-white rounded-lg shadow p-6">
    <p class="text-gray-500">No parsed job data available</p>
  </div>
</template>

<script setup>
const props = defineProps({
  attributes: {
    type: Object,
    default: null
  }
})

// Format salary range
const formatSalary = (salaryRange) => {
  if (!salaryRange) return 'Not specified'

  const { min, max, currency = 'USD', period = 'annual' } = salaryRange

  if (!min && !max) return 'Not specified'

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })

  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)} (${period})`
  } else if (min) {
    return `${formatter.format(min)}+ (${period})`
  } else if (max) {
    return `Up to ${formatter.format(max)} (${period})`
  }

  return 'Not specified'
}
</script>

<style scoped>
/* Add any custom styles here */
</style>
