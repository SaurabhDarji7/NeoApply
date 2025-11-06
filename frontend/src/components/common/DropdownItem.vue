<template>
  <component
    :is="component"
    :to="to"
    :href="href"
    :class="itemClasses"
    role="menuitem"
    @click="handleClick"
  >
    <span v-if="$slots.icon" class="dropdown-item-icon">
      <slot name="icon"></slot>
    </span>
    <span class="dropdown-item-text">
      <slot></slot>
    </span>
  </component>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  to: {
    type: [String, Object],
    default: null
  },
  href: {
    type: String,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  },
  danger: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const component = computed(() => {
  if (props.to) return 'router-link'
  if (props.href) return 'a'
  return 'button'
})

const itemClasses = computed(() => {
  const classes = ['dropdown-item']

  if (props.disabled) {
    classes.push('dropdown-item-disabled')
  }

  if (props.danger) {
    classes.push('dropdown-item-danger')
  }

  return classes.join(' ')
})

const handleClick = (event) => {
  if (!props.disabled) {
    emit('click', event)
  }
}
</script>

<style scoped>
.dropdown-item {
  @apply w-full flex items-center gap-2;
  @apply px-4 py-2 text-sm text-gray-700;
  @apply hover:bg-gray-100 transition-colors duration-150;
  @apply text-left;
}

.dropdown-item-disabled {
  @apply opacity-50 cursor-not-allowed;
  @apply hover:bg-transparent;
}

.dropdown-item-danger {
  @apply text-red-600;
  @apply hover:bg-red-50;
}

.dropdown-item-icon {
  @apply w-5 h-5 flex-shrink-0;
}

.dropdown-item-text {
  @apply flex-1;
}
</style>
