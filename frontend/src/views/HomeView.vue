<template>
  <div class="container mx-auto px-4 py-16">
    <div class="max-w-4xl mx-auto text-center">
      <h1 class="text-5xl font-bold text-gray-900 mb-4">
        Welcome to NeoApply
      </h1>
      <p class="text-xl text-gray-600 mb-8">
        Your intelligent job application assistant
      </p>
      <div class="card">
        <p class="text-lg text-gray-700 mb-6">
          Get started with NeoApply
        </p>
        <div class="flex justify-center space-x-4">
          <router-link to="/register" class="btn">
            Create Account
          </router-link>
          <router-link to="/login" class="btn-secondary">
            Sign In
          </router-link>
        </div>
        <p class="text-sm text-gray-500 mt-6">
          Backend API: <code class="bg-gray-100 px-2 py-1 rounded">{{ apiUrl }}</code>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const apiUrl = ref(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1')
</script>
