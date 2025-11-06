<template>
  <div :class="['empty-state', containerClass]">
    <div class="empty-state-icon">
      <slot name="icon">
        <!-- Default icon: Document/Files -->
        <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      </slot>
    </div>

    <h3 class="empty-state-title">{{ title }}</h3>
    <p class="empty-state-description">{{ description }}</p>

    <div v-if="$slots.action || action" class="empty-state-action">
      <slot name="action">
        <Button
          v-if="action"
          variant="primary"
          @click="$emit('action')"
        >
          {{ actionLabel }}
        </Button>
      </slot>
    </div>

    <div v-if="$slots.extra" class="empty-state-extra">
      <slot name="extra"></slot>
    </div>
  </div>
</template>

<script setup>
import Button from './Button.vue'

defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  actionLabel: {
    type: String,
    default: 'Get Started'
  },
  action: {
    type: Boolean,
    default: false
  },
  containerClass: {
    type: String,
    default: ''
  }
})

defineEmits(['action'])
</script>

<style scoped>
.empty-state {
  @apply flex flex-col items-center justify-center;
  @apply px-6 py-12 text-center;
  @apply min-h-[400px];
}

.empty-state-icon {
  @apply w-16 h-16 mb-4 text-gray-400;
  @apply flex items-center justify-center;
}

.empty-state-title {
  @apply text-xl font-semibold text-gray-900 mb-2;
}

.empty-state-description {
  @apply text-base text-gray-600 max-w-md mb-6;
  @apply leading-relaxed;
}

.empty-state-action {
  @apply mb-4;
}

.empty-state-extra {
  @apply mt-4 text-sm text-gray-500;
}

/* Variations for different contexts */
.empty-state.compact {
  @apply min-h-[300px] py-8;
}

.empty-state.large {
  @apply min-h-[500px] py-16;
}
</style>
