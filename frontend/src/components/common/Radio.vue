<template>
  <div class="radio-field">
    <label :class="['radio-label', { 'radio-disabled': disabled }]">
      <input
        :id="radioId"
        type="radio"
        :name="name"
        :value="value"
        :checked="modelValue === value"
        :disabled="disabled"
        :required="required"
        :class="radioClasses"
        @change="handleChange"
      />
      <span class="radio-custom">
        <span v-if="modelValue === value" class="radio-dot"></span>
      </span>
      <span v-if="label || $slots.default" class="radio-text">
        <slot>{{ label }}</slot>
      </span>
    </label>
    <p v-if="hint" class="radio-hint">{{ hint }}</p>
    <p v-if="error" class="radio-error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean],
    default: null
  },
  value: {
    type: [String, Number, Boolean],
    required: true
  },
  name: {
    type: String,
    required: true
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

const radioId = computed(() => `radio-${Math.random().toString(36).substr(2, 9)}`)

const radioClasses = computed(() => {
  const classes = ['radio-input']

  // Size classes
  const sizeClasses = {
    sm: 'radio-sm',
    md: 'radio-md',
    lg: 'radio-lg'
  }
  classes.push(sizeClasses[props.size])

  // Error state
  if (props.error) {
    classes.push('radio-error')
  }

  return classes.join(' ')
})

const handleChange = (event) => {
  if (event.target.checked) {
    emit('update:modelValue', props.value)
    emit('change', props.value)
  }
}
</script>

<style scoped>
.radio-field {
  @apply space-y-1;
}

.radio-label {
  @apply flex items-start gap-2 cursor-pointer select-none;
  @apply transition-all duration-200;
}

.radio-label:hover:not(.radio-disabled) .radio-custom {
  @apply border-primary-400;
}

.radio-disabled {
  @apply cursor-not-allowed opacity-60;
}

/* Hide default radio */
.radio-input {
  @apply sr-only;
}

/* Custom Radio */
.radio-custom {
  @apply flex items-center justify-center flex-shrink-0;
  @apply border-2 border-gray-300 rounded-full;
  @apply bg-white;
  @apply transition-all duration-200;
}

/* Checked state */
.radio-input:checked + .radio-custom {
  @apply bg-white border-primary-600;
}

/* Focus state */
.radio-input:focus + .radio-custom {
  @apply ring-2 ring-primary-500 ring-offset-2;
}

/* Disabled state */
.radio-input:disabled + .radio-custom {
  @apply bg-gray-100 border-gray-200 cursor-not-allowed;
}

/* Error state */
.radio-error + .radio-custom {
  @apply border-red-300;
}

.radio-input:checked.radio-error + .radio-custom {
  @apply border-red-600;
}

/* Radio Dot */
.radio-dot {
  @apply rounded-full bg-primary-600;
  @apply transition-all duration-200;
}

.radio-input:disabled + .radio-custom .radio-dot {
  @apply bg-gray-400;
}

/* Size Variants */
.radio-sm + .radio-custom {
  @apply w-4 h-4;
}

.radio-sm + .radio-custom .radio-dot {
  @apply w-2 h-2;
}

.radio-md + .radio-custom {
  @apply w-5 h-5;
}

.radio-md + .radio-custom .radio-dot {
  @apply w-2.5 h-2.5;
}

.radio-lg + .radio-custom {
  @apply w-6 h-6;
}

.radio-lg + .radio-custom .radio-dot {
  @apply w-3 h-3;
}

/* Radio Text */
.radio-text {
  @apply text-sm text-gray-700 leading-tight pt-0.5;
}

.radio-sm ~ .radio-text {
  @apply text-xs;
}

.radio-lg ~ .radio-text {
  @apply text-base;
}

/* Hint and Error */
.radio-hint {
  @apply text-xs text-gray-500 ml-7;
}

.radio-error {
  @apply text-xs text-red-600 font-medium ml-7;
}
</style>
