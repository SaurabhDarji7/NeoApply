<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <router-view />
    <ToastContainer />
  </div>
</template>

<script setup>
import ToastContainer from './components/common/ToastContainer.vue'
</script>

<style scoped>
/* Additional app-level styles can go here */
</style>
