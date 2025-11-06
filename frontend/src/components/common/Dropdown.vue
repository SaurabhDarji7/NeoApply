<template>
  <div class="dropdown" ref="dropdownRef">
    <button
      type="button"
      class="dropdown-trigger"
      @click="toggleDropdown"
      :aria-expanded="isOpen"
      :aria-haspopup="true"
    >
      <slot name="trigger">
        <span>Options</span>
        <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </slot>
    </button>

    <transition name="dropdown">
      <div
        v-if="isOpen"
        :class="['dropdown-menu', alignmentClass, sizeClass]"
        role="menu"
      >
        <slot></slot>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  align: {
    type: String,
    default: 'left',
    validator: (value) => ['left', 'right'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  }
})

const emit = defineEmits(['open', 'close'])

const isOpen = ref(false)
const dropdownRef = ref(null)

const alignmentClass = computed(() => `dropdown-menu-${props.align}`)
const sizeClass = computed(() => `dropdown-menu-${props.size}`)

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    emit('open')
  } else {
    emit('close')
  }
}

const closeDropdown = () => {
  isOpen.value = false
  emit('close')
}

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    closeDropdown()
  }
}

const handleEscape = (event) => {
  if (event.key === 'Escape' && isOpen.value) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
})

// Expose close method for parent components
defineExpose({
  close: closeDropdown
})
</script>

<style scoped>
.dropdown {
  @apply relative inline-block;
}

.dropdown-trigger {
  @apply inline-flex items-center justify-center;
  @apply px-4 py-2 text-sm font-medium;
  @apply text-gray-700 bg-white border border-gray-300 rounded-lg;
  @apply hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
  @apply transition-all duration-200;
}

.dropdown-menu {
  @apply absolute mt-2 rounded-lg shadow-lg;
  @apply bg-white border border-gray-200;
  @apply py-1;
  @apply z-dropdown;
  @apply max-h-96 overflow-y-auto;
}

/* Alignment */
.dropdown-menu-left {
  @apply left-0;
}

.dropdown-menu-right {
  @apply right-0;
}

/* Size */
.dropdown-menu-sm {
  @apply min-w-[8rem];
}

.dropdown-menu-md {
  @apply min-w-[12rem];
}

.dropdown-menu-lg {
  @apply min-w-[16rem];
}

/* Transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
