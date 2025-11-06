<template>
  <div class="toggle-field">
    <label :class="['toggle-label', { 'toggle-disabled': disabled }]">
      <input
        :id="toggleId"
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        :required="required"
        class="toggle-input"
        @change="handleChange"
      />
      <span :class="['toggle-switch', sizeClass]">
        <span :class="['toggle-thumb', { 'toggle-thumb-checked': modelValue }]"></span>
      </span>
      <span v-if="label || $slots.default" class="toggle-text">
        <slot>{{ label }}</slot>
      </span>
    </label>
    <p v-if="hint" class="toggle-hint">{{ hint }}</p>
    <p v-if="error" class="toggle-error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    default: ''
  },
  hint: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const toggleId = computed(() => `toggle-${Math.random().toString(36).substr(2, 9)}`)

const sizeClass = computed(() => `toggle-switch-${props.size}`)

const handleChange = (event) => {
  emit('update:modelValue', event.target.checked)
  emit('change', event.target.checked)
}
</script>

<style scoped>
.toggle-field {
  @apply space-y-1;
}

.toggle-label {
  @apply flex items-center gap-3 cursor-pointer select-none;
  @apply transition-all duration-200;
}

.toggle-disabled {
  @apply cursor-not-allowed opacity-60;
}

/* Hide default checkbox */
.toggle-input {
  @apply sr-only;
}

/* Toggle Switch */
.toggle-switch {
  @apply relative flex-shrink-0;
  @apply bg-gray-300 rounded-full;
  @apply transition-all duration-300 ease-in-out;
}

/* Checked state */
.toggle-input:checked + .toggle-switch {
  @apply bg-primary-600;
}

/* Focus state */
.toggle-input:focus + .toggle-switch {
  @apply ring-2 ring-primary-500 ring-offset-2;
}

/* Disabled state */
.toggle-input:disabled + .toggle-switch {
  @apply bg-gray-200 cursor-not-allowed;
}

/* Error state */
.toggle-input:checked + .toggle-switch.toggle-error {
  @apply bg-red-600;
}

/* Toggle Thumb */
.toggle-thumb {
  @apply absolute top-1 left-1;
  @apply bg-white rounded-full;
  @apply transition-all duration-300 ease-in-out;
  @apply shadow-md;
}

/* Size Variants */
.toggle-switch-sm {
  @apply w-9 h-5;
}

.toggle-switch-sm .toggle-thumb {
  @apply w-3 h-3;
}

.toggle-switch-sm .toggle-thumb-checked {
  @apply translate-x-4;
}

.toggle-switch-md {
  @apply w-11 h-6;
}

.toggle-switch-md .toggle-thumb {
  @apply w-4 h-4;
}

.toggle-switch-md .toggle-thumb-checked {
  @apply translate-x-5;
}

.toggle-switch-lg {
  @apply w-14 h-7;
}

.toggle-switch-lg .toggle-thumb {
  @apply w-5 h-5;
}

.toggle-switch-lg .toggle-thumb-checked {
  @apply translate-x-7;
}

/* Toggle Text */
.toggle-text {
  @apply text-sm text-gray-700 font-medium;
}

/* Hint and Error */
.toggle-hint {
  @apply text-xs text-gray-500 ml-14;
}

.toggle-error {
  @apply text-xs text-red-600 font-medium ml-14;
}

/* Hover effect */
.toggle-label:hover:not(.toggle-disabled) .toggle-switch {
  @apply shadow-sm;
}

.toggle-input:checked + .toggle-switch:hover:not(:disabled) {
  @apply bg-primary-700;
}
</style>
