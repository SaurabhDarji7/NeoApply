<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation Bar -->
    <nav class="bg-white shadow-sm sticky top-0 z-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-gray-900">NeoApply</h1>
            <nav class="hidden md:ml-8 md:flex md:space-x-4" role="navigation" aria-label="Main navigation">
              <router-link to="/dashboard" class="text-gray-900 font-medium px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors" aria-current="page">
                Dashboard
              </router-link>
              <router-link to="/resumes" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors">
                Resumes
              </router-link>
              <router-link to="/jobs" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors">
                Jobs
              </router-link>
              <router-link to="/templates" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors">
                Templates
              </router-link>
            </nav>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-700">{{ user?.email }}</span>
            <BaseButton @click="handleLogout" variant="ghost" size="sm" aria-label="Sign out">
              Logout
            </BaseButton>
          </div>
        </div>
      </div>
    </nav>

    <!-- Dashboard Content -->
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- Header with Welcome Message -->
        <div class="mb-8">
          <h2 class="text-3xl font-bold text-gray-900 mb-2">
            Welcome back{{ user?.email ? ', ' + user.email.split('@')[0] : '' }}!
          </h2>
          <p class="text-gray-600">Here's your job application progress at a glance.</p>
        </div>

        <!-- Progress Indicator (if not complete) -->
        <BaseCard v-if="profileCompleteness < 100" class="mb-6" padding="lg">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-1">Complete Your Profile</h3>
              <p class="text-sm text-gray-600">{{ profileCompleteness }}% complete - {{ getNextStep }}</p>
            </div>
            <BaseBadge :variant="profileCompleteness >= 75 ? 'success' : profileCompleteness >= 50 ? 'warning' : 'error'" show-icon>
              {{ profileCompleteness }}%
            </BaseBadge>
          </div>

          <ProgressBar :progress="profileCompleteness" variant="primary" :show-percentage="false" />

          <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <router-link
              v-if="stats.resumes === 0"
              to="/resumes"
              class="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
            >
              <div class="flex-shrink-0 mr-3">
                <svg class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 group-hover:text-blue-700">Upload your first resume</p>
              </div>
              <svg class="h-5 w-5 text-gray-400 group-hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </router-link>

            <router-link
              v-if="stats.jobs === 0"
              to="/jobs"
              class="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
            >
              <div class="flex-shrink-0 mr-3">
                <svg class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 group-hover:text-green-700">Add your first job description</p>
              </div>
              <svg class="h-5 w-5 text-gray-400 group-hover:text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </router-link>

            <router-link
              v-if="stats.templates === 0 && stats.resumes > 0"
              to="/templates"
              class="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
            >
              <div class="flex-shrink-0 mr-3">
                <svg class="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 group-hover:text-purple-700">Create your first template</p>
              </div>
              <svg class="h-5 w-5 text-gray-400 group-hover:text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </router-link>
          </div>
        </BaseCard>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <BaseCard padding="none" hoverable>
            <div class="flex items-center p-6">
              <div class="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Resumes
                  </dt>
                  <dd class="text-3xl font-semibold text-gray-900">
                    {{ stats.resumes }}
                  </dd>
                </dl>
              </div>
            </div>
          </BaseCard>

          <BaseCard padding="none" hoverable>
            <div class="flex items-center p-6">
              <div class="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Job Descriptions
                  </dt>
                  <dd class="text-3xl font-semibold text-gray-900">
                    {{ stats.jobs }}
                  </dd>
                </dl>
              </div>
            </div>
          </BaseCard>

          <BaseCard padding="none" hoverable>
            <div class="flex items-center p-6">
              <div class="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Templates
                  </dt>
                  <dd class="text-3xl font-semibold text-gray-900">
                    {{ stats.templates }}
                  </dd>
                </dl>
              </div>
            </div>
          </BaseCard>
        </div>

        <!-- Quick Actions -->
        <BaseCard title="Quick Actions" class="mb-8">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <BaseButton
              @click="$router.push('/resumes')"
              variant="primary"
              size="lg"
              full-width
              aria-label="Go to resumes page"
            >
              <template #icon>
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </template>
              Manage Resumes
            </BaseButton>

            <BaseButton
              @click="$router.push('/templates')"
              variant="primary"
              size="lg"
              full-width
              aria-label="Go to templates page"
            >
              <template #icon>
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </template>
              Manage Templates
            </BaseButton>

            <BaseButton
              @click="$router.push('/jobs')"
              variant="secondary"
              size="lg"
              full-width
              aria-label="Go to jobs page"
            >
              <template #icon>
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </template>
              Job Descriptions
            </BaseButton>
          </div>
        </BaseCard>

        <!-- Recent Activity (placeholder for now) -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BaseCard title="Recent Resumes">
            <EmptyState
              type="resumes"
              title="No resumes yet"
              description="Upload your first resume to get started with tailored applications."
              action-label="Upload Resume"
              @action="$router.push('/resumes')"
            />
          </BaseCard>

          <BaseCard title="Recent Jobs">
            <EmptyState
              type="jobs"
              title="No jobs added"
              description="Add job descriptions to match them with your resume."
              action-label="Add Job"
              @action="$router.push('/jobs')"
            />
          </BaseCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'

const authStore = useAuthStore()

const user = computed(() => authStore.currentUser)

// Mock stats - these should come from an API
const stats = ref({
  resumes: 0,
  jobs: 0,
  templates: 0
})

const profileCompleteness = computed(() => {
  let completeness = 30 // Base for having an account
  if (stats.value.resumes > 0) completeness += 30
  if (stats.value.jobs > 0) completeness += 20
  if (stats.value.templates > 0) completeness += 20
  return Math.min(completeness, 100)
})

const getNextStep = computed(() => {
  if (stats.value.resumes === 0) return 'Upload your first resume to continue'
  if (stats.value.jobs === 0) return 'Add a job description to match with your resume'
  if (stats.value.templates === 0) return 'Create a template to generate tailored resumes'
  return 'You\'re all set! Start applying to jobs'
})

const handleLogout = async () => {
  await authStore.logout()
}

// Fetch stats on mount - This should be replaced with actual API call
onMounted(async () => {
  // TODO: Fetch actual stats from backend
  // const response = await api.get('/dashboard/stats')
  // stats.value = response.data
})
</script>
