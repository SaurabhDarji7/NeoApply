import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])
  let nextId = 0

  const addToast = ({ title, message = '', type = 'info', duration = 5000 }) => {
    const id = nextId++
    const toast = {
      id,
      title,
      message,
      type,
      duration
    }

    toasts.value.push(toast)
    return id
  }

  const removeToast = (id) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  const clearAll = () => {
    toasts.value = []
  }

  return {
    toasts,
    addToast,
    removeToast,
    clearAll
  }
})
