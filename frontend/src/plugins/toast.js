import { createApp, h } from 'vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'

export default {
  install(app) {
    // Create a container div for toasts
    const toastContainer = document.createElement('div')
    toastContainer.id = 'toast-container'
    document.body.appendChild(toastContainer)

    // Create and mount the ToastContainer component
    const toastApp = createApp({
      render() {
        return h(ToastContainer, { ref: 'toastContainer' })
      }
    })

    const toastInstance = toastApp.mount(toastContainer)
    const toastComponent = toastInstance.$refs.toastContainer

    // Create global toast API
    const toast = {
      add: (options) => {
        return toastComponent.addToast(options)
      },
      success: (title, message, options = {}) => {
        return toastComponent.addToast({
          type: 'success',
          title,
          message,
          duration: 5000,
          ...options
        })
      },
      error: (title, message, options = {}) => {
        return toastComponent.addToast({
          type: 'error',
          title,
          message,
          duration: 7000,
          ...options
        })
      },
      warning: (title, message, options = {}) => {
        return toastComponent.addToast({
          type: 'warning',
          title,
          message,
          duration: 5000,
          ...options
        })
      },
      info: (title, message, options = {}) => {
        return toastComponent.addToast({
          type: 'info',
          title,
          message,
          duration: 5000,
          ...options
        })
      }
    }

    // Make toast available globally
    app.config.globalProperties.$toast = toast
    app.provide('toast', toast)
  }
}
