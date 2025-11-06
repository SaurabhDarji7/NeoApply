import { useToastStore } from '@/stores/toastStore'

export function useToast() {
  const toastStore = useToastStore()

  const toast = {
    success: (title, message = '', duration = 5000) => {
      return toastStore.addToast({
        title,
        message,
        type: 'success',
        duration
      })
    },

    error: (title, message = '', duration = 5000) => {
      return toastStore.addToast({
        title,
        message,
        type: 'error',
        duration
      })
    },

    warning: (title, message = '', duration = 5000) => {
      return toastStore.addToast({
        title,
        message,
        type: 'warning',
        duration
      })
    },

    info: (title, message = '', duration = 5000) => {
      return toastStore.addToast({
        title,
        message,
        type: 'info',
        duration
      })
    },

    // Generic toast method
    show: (options) => {
      return toastStore.addToast(options)
    },

    // Remove a specific toast
    remove: (id) => {
      toastStore.removeToast(id)
    },

    // Clear all toasts
    clearAll: () => {
      toastStore.clearAll()
    }
  }

  return toast
}
