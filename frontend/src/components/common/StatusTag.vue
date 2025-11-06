<template>
  <span :class="tagClasses">
    <span v-if="withDot" class="tag-dot"></span>
    <slot></slot>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'neutral',
    validator: (value) => [
      'success', 'warning', 'danger', 'info', 'neutral',
      'primary', 'secondary', 'accent',
      // Skill categories
      'frontend', 'backend', 'database', 'devops', 'design', 'other'
    ].includes(value)
  },
  withDot: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  }
})

const tagClasses = computed(() => {
  const classes = ['tag']

  // Variant classes
  const variantClasses = {
    // Status variants
    success: 'tag-success',
    warning: 'tag-warning',
    danger: 'tag-danger',
    info: 'tag-info',
    neutral: 'tag-neutral',
    primary: 'tag-primary',
    secondary: 'tag-secondary',
    accent: 'tag-accent',
    // Skill category variants
    frontend: 'tag-frontend',
    backend: 'tag-backend',
    database: 'tag-database',
    devops: 'tag-devops',
    design: 'tag-design',
    other: 'tag-other'
  }
  classes.push(variantClasses[props.variant])

  // Size classes
  const sizeClasses = {
    sm: 'tag-sm',
    md: 'tag-md',
    lg: 'tag-lg'
  }
  classes.push(sizeClasses[props.size])

  return classes.join(' ')
})
</script>

<style scoped>
/* Base Tag Styles */
.tag {
  @apply inline-flex items-center gap-1.5;
  @apply rounded-full font-medium;
  @apply transition-all duration-200;
  @apply border;
}

/* Size Variants */
.tag-sm {
  @apply px-2 py-0.5 text-xs;
}

.tag-md {
  @apply px-2.5 py-1 text-xs;
}

.tag-lg {
  @apply px-3 py-1.5 text-sm;
}

/* Status Variants */
.tag-success {
  @apply bg-green-50 text-green-700 border-green-200;
}

.tag-warning {
  @apply bg-amber-50 text-amber-700 border-amber-200;
}

.tag-danger {
  @apply bg-red-50 text-red-700 border-red-200;
}

.tag-info {
  @apply bg-blue-50 text-blue-700 border-blue-200;
}

.tag-neutral {
  @apply bg-gray-50 text-gray-700 border-gray-200;
}

.tag-primary {
  @apply bg-primary-50 text-primary-700 border-primary-200;
}

.tag-secondary {
  @apply bg-secondary-50 text-secondary-700 border-secondary-200;
}

.tag-accent {
  @apply bg-accent-50 text-accent-700 border-accent-200;
}

/* Skill Category Variants */
.tag-frontend {
  @apply bg-blue-100 text-blue-800 border-blue-300;
}

.tag-backend {
  @apply bg-green-100 text-green-800 border-green-300;
}

.tag-database {
  @apply bg-purple-100 text-purple-800 border-purple-300;
}

.tag-devops {
  @apply bg-orange-100 text-orange-800 border-orange-300;
}

.tag-design {
  @apply bg-pink-100 text-pink-800 border-pink-300;
}

.tag-other {
  @apply bg-gray-100 text-gray-800 border-gray-300;
}

/* Dot Indicator */
.tag-dot {
  @apply w-1.5 h-1.5 rounded-full bg-current;
}

/* Hover Effect (for interactive tags) */
.tag {
  @apply cursor-default;
}
</style>
