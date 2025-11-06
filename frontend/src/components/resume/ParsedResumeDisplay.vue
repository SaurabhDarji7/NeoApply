<template>
  <div v-if="parsedData" class="parsed-resume-display">
    <!-- Personal Info Section -->
    <section class="mb-8 bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Personal Information</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-if="parsedData.personal_info?.name">
          <span class="text-sm font-medium text-gray-500">Name</span>
          <p class="text-base text-gray-900">{{ parsedData.personal_info.name }}</p>
        </div>
        <div v-if="parsedData.personal_info?.email">
          <span class="text-sm font-medium text-gray-500">Email</span>
          <p class="text-base text-gray-900 flex items-center gap-2">
            {{ parsedData.personal_info.email }}
            <button @click="copyToClipboard(parsedData.personal_info.email)" class="text-blue-600 hover:text-blue-800">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </p>
        </div>
        <div v-if="parsedData.personal_info?.phone">
          <span class="text-sm font-medium text-gray-500">Phone</span>
          <p class="text-base text-gray-900 flex items-center gap-2">
            {{ parsedData.personal_info.phone }}
            <button @click="copyToClipboard(parsedData.personal_info.phone)" class="text-blue-600 hover:text-blue-800">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </p>
        </div>
        <div v-if="parsedData.personal_info?.location">
          <span class="text-sm font-medium text-gray-500">Location</span>
          <p class="text-base text-gray-900">{{ parsedData.personal_info.location }}</p>
        </div>
        <div v-if="parsedData.personal_info?.linkedin" class="md:col-span-2">
          <span class="text-sm font-medium text-gray-500">LinkedIn</span>
          <p class="text-base text-blue-600">
            <a :href="parsedData.personal_info.linkedin" target="_blank" class="hover:underline">
              {{ parsedData.personal_info.linkedin }}
            </a>
          </p>
        </div>
        <div v-if="parsedData.personal_info?.github" class="md:col-span-2">
          <span class="text-sm font-medium text-gray-500">GitHub</span>
          <p class="text-base text-blue-600">
            <a :href="parsedData.personal_info.github" target="_blank" class="hover:underline">
              {{ parsedData.personal_info.github }}
            </a>
          </p>
        </div>
      </div>
    </section>

    <!-- Summary Section -->
    <section v-if="parsedData.summary" class="mb-8 bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Professional Summary</h2>
      <p class="text-base text-gray-700">{{ parsedData.summary }}</p>
    </section>

    <!-- Skills Section -->
    <section v-if="parsedData.skills && parsedData.skills.length > 0" class="mb-8 bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Skills</h2>
      <div v-for="category in skillsByCategory" :key="category.name" class="mb-4 last:mb-0">
        <h3 class="text-sm font-semibold text-gray-600 mb-2">{{ category.name }}</h3>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="skill in category.skills"
            :key="skill.name"
            :class="[
              'px-3 py-1 rounded-full text-sm font-medium',
              getCategoryColor(category.name)
            ]"
          >
            {{ skill.name }}
          </span>
        </div>
      </div>
    </section>

    <!-- Experience Section -->
    <section v-if="parsedData.experience && parsedData.experience.length > 0" class="mb-8 bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Experience</h2>
      <div class="space-y-6">
        <div v-for="(exp, index) in parsedData.experience" :key="index" class="border-l-4 border-blue-500 pl-4">
          <div class="flex justify-between items-start mb-2">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">{{ exp.title }}</h3>
              <p class="text-base text-gray-700">{{ exp.company }}</p>
            </div>
            <span class="text-sm text-gray-500">{{ exp.duration || formatDuration(exp.start_date, exp.end_date) }}</span>
          </div>
          <p class="text-sm text-gray-600 mb-2">
            {{ formatDateRange(exp.start_date, exp.end_date) }}
            <span v-if="exp.location"> • {{ exp.location }}</span>
          </p>
          <ul class="list-disc list-inside space-y-1">
            <li v-for="(resp, respIndex) in exp.responsibilities" :key="respIndex" class="text-sm text-gray-700">
              {{ resp }}
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Education Section -->
    <section v-if="parsedData.education && parsedData.education.length > 0" class="mb-8 bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Education</h2>
      <div class="space-y-4">
        <div v-for="(edu, index) in parsedData.education" :key="index">
          <h3 class="text-lg font-semibold text-gray-900">{{ edu.degree }}</h3>
          <p class="text-base text-gray-700">{{ edu.institution }}</p>
          <p class="text-sm text-gray-600">
            {{ edu.field }}
            <span v-if="edu.graduation_year"> • Graduated {{ edu.graduation_year }}</span>
            <span v-if="edu.gpa"> • GPA: {{ edu.gpa }}</span>
          </p>
        </div>
      </div>
    </section>

    <!-- Certifications Section -->
    <section v-if="parsedData.certifications && parsedData.certifications.length > 0" class="mb-8 bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Certifications</h2>
      <div class="space-y-3">
        <div v-for="(cert, index) in parsedData.certifications" :key="index">
          <h3 class="text-base font-semibold text-gray-900">{{ cert.name }}</h3>
          <p class="text-sm text-gray-600">
            {{ cert.issuer }}
            <span v-if="cert.date"> • Issued {{ cert.date }}</span>
          </p>
          <p v-if="cert.credential_id" class="text-xs text-gray-500">ID: {{ cert.credential_id }}</p>
        </div>
      </div>
    </section>

    <!-- Projects Section -->
    <section v-if="parsedData.projects && parsedData.projects.length > 0" class="mb-8 bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Projects</h2>
      <div class="space-y-4">
        <div v-for="(project, index) in parsedData.projects" :key="index">
          <h3 class="text-lg font-semibold text-gray-900">{{ project.name }}</h3>
          <p class="text-sm text-gray-700 mb-2">{{ project.description }}</p>
          <div class="flex flex-wrap gap-2 mb-2">
            <span
              v-for="tech in project.technologies"
              :key="tech"
              class="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs"
            >
              {{ tech }}
            </span>
          </div>
          <a v-if="project.url" :href="project.url" target="_blank" class="text-sm text-blue-600 hover:underline">
            View Project →
          </a>
        </div>
      </div>
    </section>

    <!-- Languages Section -->
    <section v-if="parsedData.languages && parsedData.languages.length > 0" class="mb-8 bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Languages</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div v-for="(lang, index) in parsedData.languages" :key="index">
          <p class="text-base font-medium text-gray-900">{{ lang.language }}</p>
          <p class="text-sm text-gray-600">{{ lang.proficiency }}</p>
        </div>
      </div>
    </section>
  </div>

  <div v-else class="bg-white rounded-lg shadow p-6">
    <p class="text-gray-500">No parsed data available</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  parsedData: {
    type: Object,
    default: null
  }
})

// Group skills by category
const skillsByCategory = computed(() => {
  if (!props.parsedData?.skills) return []

  const categories = {}
  props.parsedData.skills.forEach(skill => {
    const category = skill.category || 'Other'
    if (!categories[category]) {
      categories[category] = []
    }
    categories[category].push(skill)
  })

  return Object.keys(categories).map(name => ({
    name,
    skills: categories[name]
  }))
})

// Get color class for skill category
const getCategoryColor = (category) => {
  const colors = {
    'Frontend': 'bg-blue-100 text-blue-800',
    'Backend': 'bg-green-100 text-green-800',
    'Database': 'bg-purple-100 text-purple-800',
    'DevOps': 'bg-orange-100 text-orange-800',
    'Soft Skills': 'bg-pink-100 text-pink-800',
    'Other': 'bg-gray-100 text-gray-800'
  }
  return colors[category] || colors['Other']
}

// Format date range
const formatDateRange = (startDate, endDate) => {
  if (!startDate) return ''
  const end = endDate === 'Present' ? 'Present' : endDate
  return `${startDate} - ${end}`
}

// Format duration
const formatDuration = (startDate, endDate) => {
  // This is a simplified version - you can enhance this
  return ''
}

// Copy to clipboard
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    // You could add a toast notification here
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>

<style scoped>
/* Add any custom styles here */
</style>
