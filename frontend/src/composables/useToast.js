import { getCurrentInstance } from 'vue'

export function useToast() {
  const instance = getCurrentInstance()

  if (!instance) {
    console.warn('useToast must be called within a component setup function')
    return {
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {}
    }
  }

  const toast = instance.appContext.config.globalProperties.$toast

  if (!toast) {
    console.warn('Toast plugin not installed')
    return {
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {}
    }
  }

  return {
    success: (title, message, options = {}) => {
      return toast.add({
        type: 'success',
        title,
        message,
        duration: 5000,
        ...options
      })
    },
    error: (title, message, options = {}) => {
      return toast.add({
        type: 'error',
        title,
        message,
        duration: 7000,
        ...options
      })
    },
    warning: (title, message, options = {}) => {
      return toast.add({
        type: 'warning',
        title,
        message,
        duration: 5000,
        ...options
      })
    },
    info: (title, message, options = {}) => {
      return toast.add({
        type: 'info',
        title,
        message,
        duration: 5000,
        ...options
      })
    }
  }
}
