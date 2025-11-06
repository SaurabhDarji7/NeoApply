<template>
  <div class="text-center py-12 px-4">
    <!-- Icon -->
    <div class="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gray-100 mb-4">
      <slot name="icon">
        <svg
          class="h-10 w-10 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            :d="iconPath"
          />
        </svg>
      </slot>
    </div>

    <!-- Title -->
    <h3 class="text-lg font-semibold text-gray-900 mb-2">
      <slot name="title">{{ title }}</slot>
    </h3>

    <!-- Description -->
    <p class="text-sm text-gray-600 max-w-sm mx-auto mb-6">
      <slot name="description">{{ description }}</slot>
    </p>

    <!-- Action Buttons -->
    <div v-if="$slots.action || actionLabel" class="flex justify-center gap-3">
      <slot name="action">
        <BaseButton
          v-if="actionLabel"
          @click="handleAction"
          :variant="actionVariant"
        >
          {{ actionLabel }}
        </BaseButton>
      </slot>
    </div>

    <!-- Secondary Actions -->
    <div v-if="$slots.secondary" class="mt-4">
      <slot name="secondary"></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseButton from './BaseButton.vue'

const props = defineProps({
  type: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'resumes', 'jobs', 'templates', 'search'].includes(value)
  },
  title: {
    type: String,
    default: 'No items found'
  },
  description: {
    type: String,
    default: 'Get started by creating a new item.'
  },
  actionLabel: {
    type: String,
    default: ''
  },
  actionVariant: {
    type: String,
    default: 'primary'
  }
})

const emit = defineEmits(['action'])

const iconPath = computed(() => {
  const icons = {
    default: 'M12 4v16m8-8H4',
    resumes: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    jobs: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    templates: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
  }

  return icons[props.type] || icons.default
})

const handleAction = () => {
  emit('action')
}
</script>
