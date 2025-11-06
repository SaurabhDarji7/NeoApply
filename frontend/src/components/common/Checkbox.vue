<template>
  <div class="checkbox-field">
    <label :class="['checkbox-label', { 'checkbox-disabled': disabled }]">
      <input
        :id="checkboxId"
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        :required="required"
        :value="value"
        :class="checkboxClasses"
        @change="handleChange"
      />
      <span class="checkbox-custom">
        <svg v-if="modelValue" class="checkbox-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
        </svg>
      </span>
      <span v-if="label || $slots.default" class="checkbox-text">
        <slot>{{ label }}</slot>
      </span>
    </label>
    <p v-if="hint" class="checkbox-hint">{{ hint }}</p>
    <p v-if="error" class="checkbox-error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  value: {
    type: [String, Number, Boolean],
    default: null
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

const checkboxId = computed(() => `checkbox-${Math.random().toString(36).substr(2, 9)}`)

const checkboxClasses = computed(() => {
  const classes = ['checkbox-input']

  // Size classes
  const sizeClasses = {
    sm: 'checkbox-sm',
    md: 'checkbox-md',
    lg: 'checkbox-lg'
  }
  classes.push(sizeClasses[props.size])

  // Error state
  if (props.error) {
    classes.push('checkbox-error')
  }

  return classes.join(' ')
})

const handleChange = (event) => {
  emit('update:modelValue', event.target.checked)
  emit('change', event.target.checked)
}
</script>

<style scoped>
.checkbox-field {
  @apply space-y-1;
}

.checkbox-label {
  @apply flex items-start gap-2 cursor-pointer select-none;
  @apply transition-all duration-200;
}

.checkbox-label:hover:not(.checkbox-disabled) .checkbox-custom {
  @apply border-primary-400;
}

.checkbox-disabled {
  @apply cursor-not-allowed opacity-60;
}

/* Hide default checkbox */
.checkbox-input {
  @apply sr-only;
}

/* Custom Checkbox */
.checkbox-custom {
  @apply flex items-center justify-center flex-shrink-0;
  @apply border-2 border-gray-300 rounded;
  @apply bg-white;
  @apply transition-all duration-200;
}

/* Checked state */
.checkbox-input:checked + .checkbox-custom {
  @apply bg-primary-600 border-primary-600;
}

/* Focus state */
.checkbox-input:focus + .checkbox-custom {
  @apply ring-2 ring-primary-500 ring-offset-2;
}

/* Disabled state */
.checkbox-input:disabled + .checkbox-custom {
  @apply bg-gray-100 border-gray-200 cursor-not-allowed;
}

/* Error state */
.checkbox-error + .checkbox-custom {
  @apply border-red-300;
}

.checkbox-input:checked.checkbox-error + .checkbox-custom {
  @apply bg-red-600 border-red-600;
}

/* Checkbox Icon */
.checkbox-icon {
  @apply text-white;
}

/* Size Variants */
.checkbox-sm + .checkbox-custom {
  @apply w-4 h-4;
}

.checkbox-sm + .checkbox-custom .checkbox-icon {
  @apply w-3 h-3;
}

.checkbox-md + .checkbox-custom {
  @apply w-5 h-5;
}

.checkbox-md + .checkbox-custom .checkbox-icon {
  @apply w-4 h-4;
}

.checkbox-lg + .checkbox-custom {
  @apply w-6 h-6;
}

.checkbox-lg + .checkbox-custom .checkbox-icon {
  @apply w-5 h-5;
}

/* Checkbox Text */
.checkbox-text {
  @apply text-sm text-gray-700 leading-tight pt-0.5;
}

.checkbox-sm ~ .checkbox-text {
  @apply text-xs;
}

.checkbox-lg ~ .checkbox-text {
  @apply text-base;
}

/* Hint and Error */
.checkbox-hint {
  @apply text-xs text-gray-500 ml-7;
}

.checkbox-error {
  @apply text-xs text-red-600 font-medium ml-7;
}
</style>
