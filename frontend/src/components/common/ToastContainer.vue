<template>
  <teleport to="body">
    <div class="toast-container">
      <Toast
        v-for="toast in toasts"
        :key="toast.id"
        v-bind="toast"
        @close="removeToast"
      />
    </div>
  </teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useToastStore } from '@/stores/toastStore'
import Toast from './Toast.vue'

const toastStore = useToastStore()
const toasts = computed(() => toastStore.toasts)

const removeToast = (id) => {
  toastStore.removeToast(id)
}
</script>

<style scoped>
.toast-container {
  @apply fixed top-0 right-0 p-4;
  @apply flex flex-col gap-3;
  @apply pointer-events-none;
  z-index: 9999;
}

.toast-container > * {
  @apply pointer-events-auto;
}
</style>
