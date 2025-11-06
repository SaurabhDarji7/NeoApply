# NeoApply - Frontend Requirements

## Overview
The frontend is a **Vue.js 3 Single Page Application (SPA)** built with Vite. It provides a clean, functional, minimal UI for managing resumes and job applications.

---

## Core Requirements

### 1. Vue.js Setup

**Version:**
- Vue: 3.x (Composition API)
- Node.js: 18+ LTS

**Build Tool:**
- Vite 5.x

**Project Initialization:**
```bash
npm create vite@latest neoapply-frontend -- --template vue
cd neoapply-frontend
npm install
```

---

### 2. Project Structure

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── main.js                 # Application entry point
│   ├── App.vue                 # Root component
│   ├── router/
│   │   └── index.js            # Vue Router configuration
│   ├── stores/
│   │   ├── auth.js             # Authentication state (Pinia)
│   │   ├── resume.js           # Resume management state
│   │   └── jobs.js             # Job descriptions state
│   ├── services/
│   │   ├── api.js              # Axios instance + interceptors
│   │   ├── authService.js      # Auth API calls
│   │   ├── resumeService.js    # Resume API calls
│   │   └── jobService.js       # Job API calls
│   ├── views/
│   │   ├── LoginView.vue
│   │   ├── RegisterView.vue
│   │   ├── DashboardView.vue
│   │   ├── ResumeListView.vue
│   │   ├── ResumeDetailView.vue
│   │   ├── JobListView.vue
│   │   └── JobDetailView.vue
│   ├── components/
│   │   ├── common/
│   │   │   ├── NavBar.vue
│   │   │   ├── LoadingSpinner.vue
│   │   │   ├── ErrorMessage.vue
│   │   │   └── FileUpload.vue
│   │   ├── resume/
│   │   │   ├── ResumeCard.vue
│   │   │   ├── ResumeUploadForm.vue
│   │   │   └── ParsedDataDisplay.vue
│   │   └── jobs/
│   │       ├── JobCard.vue
│   │       ├── JobUrlForm.vue
│   │       └── JobAttributesDisplay.vue
│   ├── composables/
│   │   ├── useAuth.js
│   │   ├── useResume.js
│   │   └── useJob.js
│   ├── assets/
│   │   └── main.css
│   └── utils/
│       ├── validators.js
│       └── formatters.js
├── .env.development
├── .env.production
├── vite.config.js
└── package.json
```

---

### 3. Dependencies

**Core:**
```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@vue/test-utils": "^2.4.0"
  }
}
```

**Optional UI Library:**
```bash
# Option 1: Tailwind CSS (recommended for minimal UI)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Option 2: Vuetify (Material Design components)
npm install vuetify
```

**Recommendation:** Use **Tailwind CSS** for complete control over minimal, clean design.

---

### 4. State Management (Pinia)

**Installation:**
```bash
npm install pinia
```

**Setup:**
```javascript
// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
```

**Auth Store:**
```javascript
// src/stores/auth.js
import { defineStore } from 'pinia'
import { authService } from '@/services/authService'
import router from '@/router'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('jwt_token') || null,
    isAuthenticated: !!localStorage.getItem('jwt_token')
  }),

  actions: {
    async register(credentials) {
      try {
        const response = await authService.register(credentials)
        this.setAuth(response.data.user, response.data.token)
        router.push('/dashboard')
      } catch (error) {
        throw error
      }
    },

    async login(credentials) {
      try {
        const response = await authService.login(credentials)
        this.setAuth(response.data.user, response.data.token)
        router.push('/dashboard')
      } catch (error) {
        throw error
      }
    },

    async logout() {
      try {
        await authService.logout()
      } finally {
        this.clearAuth()
        router.push('/login')
      }
    },

    setAuth(user, token) {
      this.user = user
      this.token = token
      this.isAuthenticated = true
      localStorage.setItem('jwt_token', token)
    },

    clearAuth() {
      this.user = null
      this.token = null
      this.isAuthenticated = false
      localStorage.removeItem('jwt_token')
    }
  }
})
```

**Resume Store:**
```javascript
// src/stores/resume.js
import { defineStore } from 'pinia'
import { resumeService } from '@/services/resumeService'

export const useResumeStore = defineStore('resume', {
  state: () => ({
    resumes: [],
    currentResume: null,
    loading: false,
    error: null
  }),

  actions: {
    async fetchResumes() {
      this.loading = true
      try {
        const response = await resumeService.getAll()
        this.resumes = response.data
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async uploadResume(formData) {
      this.loading = true
      try {
        const response = await resumeService.upload(formData)
        this.resumes.unshift(response.data)
        return response.data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteResume(id) {
      await resumeService.delete(id)
      this.resumes = this.resumes.filter(r => r.id !== id)
    },

    async pollResumeStatus(id) {
      const poll = setInterval(async () => {
        const response = await resumeService.getStatus(id)
        const status = response.data.status

        if (status === 'completed' || status === 'failed') {
          clearInterval(poll)
          await this.fetchResumes() // Refresh list
        }
      }, 2000)
    }
  }
})
```

---

### 5. API Service Layer

**Axios Configuration:**
```javascript
// src/services/api.js
import axios from 'axios'
import router from '@/router'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor: Add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jwt_token')
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

export default apiClient
```

**Auth Service:**
```javascript
// src/services/authService.js
import api from './api'

export const authService = {
  register(credentials) {
    return api.post('/auth/register', { user: credentials })
  },

  login(credentials) {
    return api.post('/auth/login', { user: credentials })
  },

  logout() {
    return api.delete('/auth/logout')
  },

  getCurrentUser() {
    return api.get('/users/me')
  }
}
```

**Resume Service:**
```javascript
// src/services/resumeService.js
import api from './api'

export const resumeService = {
  getAll() {
    return api.get('/resumes')
  },

  getById(id) {
    return api.get(`/resumes/${id}`)
  },

  upload(formData) {
    return api.post('/resumes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  delete(id) {
    return api.delete(`/resumes/${id}`)
  },

  getStatus(id) {
    return api.get(`/resumes/${id}/status`)
  },

  triggerParse(id) {
    return api.post(`/resumes/${id}/parse`)
  }
}
```

---

### 6. Routing (Vue Router)

**Router Configuration:**
```javascript
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/resumes',
    name: 'ResumeList',
    component: () => import('@/views/ResumeListView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/resumes/:id',
    name: 'ResumeDetail',
    component: () => import('@/views/ResumeDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/jobs',
    name: 'JobList',
    component: () => import('@/views/JobListView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/jobs/:id',
    name: 'JobDetail',
    component: () => import('@/views/JobDetailView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
```

---

### 7. Key Components

**File Upload Component:**
```vue
<!-- src/components/common/FileUpload.vue -->
<template>
  <div class="file-upload">
    <div
      class="dropzone"
      @dragover.prevent
      @drop.prevent="handleDrop"
      @click="$refs.fileInput.click()"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".pdf,.docx,.txt"
        hidden
        @change="handleFileSelect"
      />
      <p v-if="!file">Click or drag file to upload (PDF, DOCX, TXT)</p>
      <p v-else>{{ file.name }}</p>
    </div>
    <button @click="uploadFile" :disabled="!file || uploading">
      {{ uploading ? 'Uploading...' : 'Upload' }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useResumeStore } from '@/stores/resume'

const resumeStore = useResumeStore()
const file = ref(null)
const uploading = ref(false)

const handleDrop = (e) => {
  file.value = e.dataTransfer.files[0]
}

const handleFileSelect = (e) => {
  file.value = e.target.files[0]
}

const uploadFile = async () => {
  if (!file.value) return

  uploading.value = true
  const formData = new FormData()
  formData.append('file', file.value)
  formData.append('name', file.value.name.replace(/\.[^/.]+$/, ''))

  try {
    await resumeStore.uploadResume(formData)
    file.value = null
  } catch (error) {
    console.error('Upload failed:', error)
  } finally {
    uploading.value = false
  }
}
</script>
```

**Resume Card Component:**
```vue
<!-- src/components/resume/ResumeCard.vue -->
<template>
  <div class="resume-card">
    <h3>{{ resume.name }}</h3>
    <p class="status" :class="resume.status">{{ resume.status }}</p>
    <p class="date">Uploaded: {{ formatDate(resume.created_at) }}</p>

    <div class="actions">
      <router-link :to="`/resumes/${resume.id}`">View Details</router-link>
      <button @click="handleDelete" class="danger">Delete</button>
    </div>

    <div v-if="resume.status === 'processing'" class="loading">
      <LoadingSpinner />
      <p>Parsing in progress...</p>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'
import { useResumeStore } from '@/stores/resume'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const props = defineProps({
  resume: Object
})

const resumeStore = useResumeStore()

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

const handleDelete = async () => {
  if (confirm('Are you sure you want to delete this resume?')) {
    await resumeStore.deleteResume(props.resume.id)
  }
}
</script>
```

**Parsed Data Display:**
```vue
<!-- src/components/resume/ParsedDataDisplay.vue -->
<template>
  <div class="parsed-data">
    <section v-if="data.personal_info">
      <h2>Personal Information</h2>
      <p><strong>Name:</strong> {{ data.personal_info.name }}</p>
      <p><strong>Email:</strong> {{ data.personal_info.email }}</p>
      <p><strong>Phone:</strong> {{ data.personal_info.phone }}</p>
      <p><strong>Location:</strong> {{ data.personal_info.location }}</p>
    </section>

    <section v-if="data.skills">
      <h2>Skills</h2>
      <div class="skills-grid">
        <span
          v-for="skill in data.skills"
          :key="skill.name"
          class="skill-tag"
        >
          {{ skill.name }}
        </span>
      </div>
    </section>

    <section v-if="data.experience">
      <h2>Experience</h2>
      <div v-for="exp in data.experience" :key="exp.company" class="experience-item">
        <h3>{{ exp.title }} @ {{ exp.company }}</h3>
        <p>{{ exp.start_date }} - {{ exp.end_date }}</p>
        <ul>
          <li v-for="resp in exp.responsibilities" :key="resp">{{ resp }}</li>
        </ul>
      </div>
    </section>

    <section v-if="data.education">
      <h2>Education</h2>
      <div v-for="edu in data.education" :key="edu.institution" class="education-item">
        <h3>{{ edu.degree }} in {{ edu.field }}</h3>
        <p>{{ edu.institution }} - {{ edu.graduation_year }}</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  data: Object
})
</script>
```

---

### 8. Views

**Login View:**
```vue
<!-- src/views/LoginView.vue -->
<template>
  <div class="login-view">
    <h1>Login to NeoApply</h1>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>Email</label>
        <input v-model="email" type="email" required />
      </div>
      <div class="form-group">
        <label>Password</label>
        <input v-model="password" type="password" required />
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Logging in...' : 'Login' }}
      </button>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
    <p>
      Don't have an account?
      <router-link to="/register">Register</router-link>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref(null)

const handleSubmit = async () => {
  loading.value = true
  error.value = null

  try {
    await authStore.login({ email: email.value, password: password.value })
  } catch (err) {
    error.value = err.response?.data?.error?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>
```

**Dashboard View:**
```vue
<!-- src/views/DashboardView.vue -->
<template>
  <div class="dashboard">
    <h1>Dashboard</h1>

    <div class="stats">
      <div class="stat-card">
        <h2>{{ resumesCount }}</h2>
        <p>Resumes</p>
      </div>
      <div class="stat-card">
        <h2>{{ jobsCount }}</h2>
        <p>Job Descriptions</p>
      </div>
    </div>

    <div class="quick-actions">
      <router-link to="/resumes" class="btn">Upload Resume</router-link>
      <router-link to="/jobs" class="btn">Add Job Description</router-link>
    </div>

    <section>
      <h2>Recent Resumes</h2>
      <ResumeCard
        v-for="resume in recentResumes"
        :key="resume.id"
        :resume="resume"
      />
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useResumeStore } from '@/stores/resume'
import { useJobStore } from '@/stores/jobs'
import ResumeCard from '@/components/resume/ResumeCard.vue'

const resumeStore = useResumeStore()
const jobStore = useJobStore()

const resumesCount = ref(0)
const jobsCount = ref(0)
const recentResumes = ref([])

onMounted(async () => {
  await resumeStore.fetchResumes()
  resumesCount.value = resumeStore.resumes.length
  recentResumes.value = resumeStore.resumes.slice(0, 3)
})
</script>
```

---

### 9. Styling (Tailwind CSS)

**Tailwind Setup:**
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**tailwind.config.js:**
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        danger: '#EF4444'
      }
    },
  },
  plugins: [],
}
```

**src/assets/main.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom utility classes */
.btn {
  @apply px-4 py-2 bg-primary text-white rounded hover:bg-blue-600 transition;
}

.btn-danger {
  @apply px-4 py-2 bg-danger text-white rounded hover:bg-red-600 transition;
}
```

---

### 10. Environment Variables

**.env.development:**
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

**.env.production:**
```env
VITE_API_BASE_URL=https://api.neoapply.com/api/v1
```

**Usage:**
```javascript
const apiUrl = import.meta.env.VITE_API_BASE_URL
```

---

### 11. Testing

**Vitest Setup:**
```bash
npm install -D vitest @vue/test-utils
```

**vitest.config.js:**
```javascript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom'
  }
})
```

**Example Test:**
```javascript
// src/components/__tests__/ResumeCard.spec.js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ResumeCard from '@/components/resume/ResumeCard.vue'

describe('ResumeCard', () => {
  it('renders resume name', () => {
    const wrapper = mount(ResumeCard, {
      props: {
        resume: {
          id: 1,
          name: 'Test Resume',
          status: 'completed'
        }
      }
    })
    expect(wrapper.text()).toContain('Test Resume')
  })
})
```

---

### 12. Build & Deployment

**Build for Production:**
```bash
npm run build
```

**Preview Production Build:**
```bash
npm run preview
```

**Deploy to Netlify/Vercel:**
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: `VITE_API_BASE_URL`

---

Last Updated: 2025-11-04
