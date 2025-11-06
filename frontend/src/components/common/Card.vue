<template>
  <div :class="cardClasses" @click="handleClick">
    <!-- Header -->
    <div v-if="hasHeader" class="card-header">
      <div class="card-header-content">
        <slot name="header"></slot>
      </div>
      <div v-if="hasHeaderAction" class="card-header-action">
        <slot name="header-action"></slot>
      </div>
    </div>

    <!-- Body -->
    <div :class="['card-body', { 'card-body-no-padding': noPadding }]">
      <slot></slot>
    </div>

    <!-- Footer -->
    <div v-if="hasFooter" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
import { computed, useSlots } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'elevated', 'flat', 'outlined'].includes(value)
  },
  hoverable: {
    type: Boolean,
    default: false
  },
  clickable: {
    type: Boolean,
    default: false
  },
  noPadding: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  }
})

const emit = defineEmits(['click'])

const slots = useSlots()

const hasHeader = computed(() => !!slots.header)
const hasHeaderAction = computed(() => !!slots['header-action'])
const hasFooter = computed(() => !!slots.footer)

const cardClasses = computed(() => {
  const classes = ['card']

  // Variant classes
  const variantClasses = {
    default: 'card-default',
    elevated: 'card-elevated',
    flat: 'card-flat',
    outlined: 'card-outlined'
  }
  classes.push(variantClasses[props.variant])

  // Size classes
  const sizeClasses = {
    sm: 'card-sm',
    md: 'card-md',
    lg: 'card-lg'
  }
  classes.push(sizeClasses[props.size])

  // Interactive states
  if (props.hoverable) {
    classes.push('card-hoverable')
  }

  if (props.clickable) {
    classes.push('card-clickable')
  }

  return classes.join(' ')
})

const handleClick = (event) => {
  if (props.clickable) {
    emit('click', event)
  }
}
</script>

<style scoped>
/* Base Card Styles - Following Humi Pattern */
.card {
  @apply bg-white rounded-lg overflow-hidden;
  @apply transition-all duration-200 ease-in-out;
}

/* Variant Styles */
.card-default {
  @apply shadow-sm border border-gray-200;
}

.card-elevated {
  @apply shadow-md;
}

.card-flat {
  @apply shadow-none border-0;
}

.card-outlined {
  @apply shadow-none border-2 border-gray-200;
}

/* Size Variants */
.card-sm {
  @apply text-sm;
}

.card-md {
  @apply text-base;
}

.card-lg {
  @apply text-lg;
}

/* Card Header */
.card-header {
  @apply px-6 py-4 border-b border-gray-200 bg-gray-50;
  @apply flex items-center justify-between;
}

.card-sm .card-header {
  @apply px-4 py-3;
}

.card-lg .card-header {
  @apply px-8 py-5;
}

.card-header-content {
  @apply flex-1 min-w-0;
  @apply font-semibold text-gray-900;
}

.card-header-action {
  @apply flex-shrink-0 ml-4;
}

/* Card Body */
.card-body {
  @apply px-6 py-5;
}

.card-sm .card-body {
  @apply px-4 py-3;
}

.card-lg .card-body {
  @apply px-8 py-6;
}

.card-body-no-padding {
  @apply p-0;
}

/* Card Footer */
.card-footer {
  @apply px-6 py-4 border-t border-gray-200 bg-gray-50;
}

.card-sm .card-footer {
  @apply px-4 py-3;
}

.card-lg .card-footer {
  @apply px-8 py-5;
}

/* Hoverable State */
.card-hoverable:hover {
  @apply shadow-md;
}

.card-elevated.card-hoverable:hover {
  @apply shadow-lg;
}

.card-outlined.card-hoverable:hover {
  @apply border-primary-300;
}

/* Clickable State */
.card-clickable {
  @apply cursor-pointer;
}

.card-clickable:hover {
  @apply shadow-lg transform scale-[1.01];
}

.card-clickable:active {
  @apply transform scale-[0.99];
}

/* Focus state for keyboard navigation */
.card-clickable:focus {
  @apply outline-none ring-2 ring-primary-500 ring-offset-2;
}

/* Smooth transitions for interactive states */
.card-hoverable,
.card-clickable {
  @apply transition-all duration-200;
}
</style>
