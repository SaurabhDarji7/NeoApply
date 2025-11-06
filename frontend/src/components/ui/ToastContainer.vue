<template>
  <div
    aria-live="polite"
    aria-atomic="true"
    class="fixed top-0 right-0 z-50 p-4 space-y-4 pointer-events-none max-h-screen overflow-hidden"
    style="max-width: 28rem"
  >
    <ToastNotification
      v-for="toast in toasts"
      :key="toast.id"
      :type="toast.type"
      :title="toast.title"
      :message="toast.message"
      :duration="toast.duration"
      :action="toast.action"
      @close="removeToast(toast.id)"
      class="pointer-events-auto"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ToastNotification from './ToastNotification.vue'

const toasts = ref([])
let nextId = 1

const addToast = (toast) => {
  const id = nextId++
  toasts.value.push({
    id,
    ...toast
  })

  // Limit to 3 toasts max
  if (toasts.value.length > 3) {
    toasts.value.shift()
  }

  return id
}

const removeToast = (id) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

// Expose methods for external use
defineExpose({
  addToast,
  removeToast
})
</script>
