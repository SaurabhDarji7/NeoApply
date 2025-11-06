import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DashboardView from '../views/DashboardView.vue'
import ResumesView from '../views/ResumesView.vue'
import ResumeDetailView from '../views/ResumeDetailView.vue'
import JobDetailView from '../views/JobDetailView.vue'
import VerifyEmailView from '../views/VerifyEmailView.vue'
import TemplatesView from '../views/TemplatesView.vue'
import OnboardingView from '../views/OnboardingView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresGuest: true }
  },
  {
    path: '/verify-email',
    name: 'VerifyEmail',
    component: VerifyEmailView,
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
    meta: { requiresGuest: true }
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: OnboardingView,
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/resumes',
    name: 'Resumes',
    component: ResumesView,
    meta: { requiresAuth: true }
  },
  {
    path: '/resumes/:id',
    name: 'ResumeDetail',
    component: ResumeDetailView,
    meta: { requiresAuth: true }
  },
  {
    path: '/jobs',
    name: 'Jobs',
    component: () => import('../views/JobsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/jobs/:id',
    name: 'JobDetail',
    component: JobDetailView,
    meta: { requiresAuth: true }
  },
  {
    path: '/templates',
    name: 'Templates',
    component: TemplatesView,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    // Redirect to login if route requires auth and user is not logged in
    next('/login')
  } else if (to.meta.requiresGuest && authStore.isLoggedIn) {
    // Redirect to dashboard if route is for guests only and user is logged in
    next('/dashboard')
  } else if (to.meta.requiresAuth && authStore.isLoggedIn) {
    // Check if user needs onboarding (unless they're already going to onboarding)
    if (authStore.needsOnboarding && to.path !== '/onboarding') {
      next('/onboarding')
    } else if (!authStore.needsOnboarding && to.path === '/onboarding') {
      // If user completed onboarding but tries to access onboarding page, redirect to dashboard
      next('/dashboard')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
