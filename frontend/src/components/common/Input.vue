<template>
  <div class="form-field">
    <label
      v-if="label"
      :for="inputId"
      class="form-label"
    >
      {{ label }}
      <span v-if="required" class="text-red-500" aria-label="required">*</span>
    </label>

    <div class="input-wrapper">
      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :maxlength="maxlength"
        :minlength="minlength"
        :min="min"
        :max="max"
        :step="step"
        :autocomplete="autocomplete"
        :class="inputClasses"
        :aria-describedby="hintId"
        :aria-invalid="!!error"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />

      <!-- Icon slot -->
      <div v-if="$slots.icon" class="input-icon">
        <slot name="icon"></slot>
      </div>

      <!-- Clear button -->
      <button
        v-if="clearable && modelValue && !disabled"
        @click="clear"
        class="input-clear"
        type="button"
        aria-label="Clear input"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <p v-if="hint && !error" :id="hintId" class="form-hint">{{ hint }}</p>
    <p v-if="error" :id="hintId" class="form-error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  type: {
    type: String,
    default: 'text',
    validator: (value) => [
      'text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date', 'time', 'datetime-local'
    ].includes(value)
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
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
  readonly: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  clearable: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  maxlength: {
    type: Number,
    default: null
  },
  minlength: {
    type: Number,
    default: null
  },
  min: {
    type: Number,
    default: null
  },
  max: {
    type: Number,
    default: null
  },
  step: {
    type: Number,
    default: null
  },
  autocomplete: {
    type: String,
    default: 'off'
  }
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus', 'clear'])

const inputId = computed(() => `input-${Math.random().toString(36).substr(2, 9)}`)
const hintId = computed(() => `hint-${inputId.value}`)

const isFocused = ref(false)

const inputClasses = computed(() => {
  const classes = ['form-input']

  // Size classes
  const sizeClasses = {
    sm: 'input-sm',
    md: 'input-md',
    lg: 'input-lg'
  }
  classes.push(sizeClasses[props.size])

  // Error state
  if (props.error) {
    classes.push('input-error')
  }

  // Focused state
  if (isFocused.value) {
    classes.push('input-focused')
  }

  return classes.join(' ')
})

const handleInput = (event) => {
  emit('update:modelValue', event.target.value)
}

const handleBlur = (event) => {
  isFocused.value = false
  emit('blur', event)
}

const handleFocus = (event) => {
  isFocused.value = true
  emit('focus', event)
}

const clear = () => {
  emit('update:modelValue', '')
  emit('clear')
}
</script>

<style scoped>
.form-field {
  @apply space-y-1.5;
}

.form-label {
  @apply block text-sm font-medium text-gray-700;
}

.input-wrapper {
  @apply relative;
}

/* Base Input Styles */
.form-input {
  @apply w-full rounded-lg border border-gray-300;
  @apply bg-white text-gray-900 placeholder-gray-400;
  @apply transition-all duration-200;
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent;
}

/* Size Variants */
.input-sm {
  @apply px-3 py-1.5 text-sm;
}

.input-md {
  @apply px-4 py-2.5 text-base;
}

.input-lg {
  @apply px-5 py-3 text-lg;
}

/* Disabled State */
.form-input:disabled {
  @apply bg-gray-50 text-gray-500 cursor-not-allowed;
  @apply border-gray-200;
}

/* Readonly State */
.form-input:read-only {
  @apply bg-gray-50;
}

/* Error State */
.input-error {
  @apply border-red-300 focus:ring-red-500;
}

/* Icon in Input */
.input-icon {
  @apply absolute right-3 top-1/2 transform -translate-y-1/2;
  @apply text-gray-400 pointer-events-none;
}

.form-input:has(~ .input-icon) {
  @apply pr-10;
}

/* Clear Button */
.input-clear {
  @apply absolute right-3 top-1/2 transform -translate-y-1/2;
  @apply text-gray-400 hover:text-gray-600;
  @apply transition-colors duration-200;
  @apply rounded p-1;
  @apply focus:outline-none focus:ring-2 focus:ring-gray-300;
}

.form-input:has(~ .input-clear) {
  @apply pr-10;
}

/* Hint Text */
.form-hint {
  @apply text-xs text-gray-500;
}

/* Error Text */
.form-error {
  @apply text-xs text-red-600 font-medium;
}

/* Focused micro-interaction */
.form-input:focus {
  @apply shadow-sm;
}
</style>
