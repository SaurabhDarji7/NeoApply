<template>
  <div class="form-field">
    <label
      v-if="label"
      :for="selectId"
      class="form-label"
    >
      {{ label }}
      <span v-if="required" class="text-red-500" aria-label="required">*</span>
    </label>

    <div class="select-wrapper">
      <select
        :id="selectId"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        :class="selectClasses"
        :aria-describedby="hintId"
        :aria-invalid="!!error"
        @change="handleChange"
        @blur="handleBlur"
        @focus="handleFocus"
      >
        <option v-if="placeholder" value="" disabled selected>
          {{ placeholder }}
        </option>
        <option
          v-for="option in options"
          :key="getOptionValue(option)"
          :value="getOptionValue(option)"
        >
          {{ getOptionLabel(option) }}
        </option>
      </select>

      <!-- Chevron Icon -->
      <div class="select-icon">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </div>
    </div>

    <p v-if="hint && !error" :id="hintId" class="form-hint">{{ hint }}</p>
    <p v-if="error" :id="hintId" class="form-error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean],
    default: ''
  },
  options: {
    type: Array,
    required: true
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Select an option'
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
  },
  // For object arrays: specify which key to use as value
  valueKey: {
    type: String,
    default: 'value'
  },
  // For object arrays: specify which key to use as label
  labelKey: {
    type: String,
    default: 'label'
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'blur', 'focus'])

const selectId = computed(() => `select-${Math.random().toString(36).substr(2, 9)}`)
const hintId = computed(() => `hint-${selectId.value}`)

const isFocused = ref(false)

const selectClasses = computed(() => {
  const classes = ['form-select']

  // Size classes
  const sizeClasses = {
    sm: 'select-sm',
    md: 'select-md',
    lg: 'select-lg'
  }
  classes.push(sizeClasses[props.size])

  // Error state
  if (props.error) {
    classes.push('select-error')
  }

  // Focused state
  if (isFocused.value) {
    classes.push('select-focused')
  }

  return classes.join(' ')
})

const getOptionValue = (option) => {
  if (typeof option === 'object' && option !== null) {
    return option[props.valueKey]
  }
  return option
}

const getOptionLabel = (option) => {
  if (typeof option === 'object' && option !== null) {
    return option[props.labelKey]
  }
  return option
}

const handleChange = (event) => {
  const value = event.target.value
  emit('update:modelValue', value)
  emit('change', value)
}

const handleBlur = (event) => {
  isFocused.value = false
  emit('blur', event)
}

const handleFocus = (event) => {
  isFocused.value = true
  emit('focus', event)
}
</script>

<style scoped>
.form-field {
  @apply space-y-1.5;
}

.form-label {
  @apply block text-sm font-medium text-gray-700;
}

.select-wrapper {
  @apply relative;
}

/* Base Select Styles */
.form-select {
  @apply w-full rounded-lg border border-gray-300;
  @apply bg-white text-gray-900;
  @apply transition-all duration-200;
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent;
  @apply appearance-none;
  @apply pr-10; /* Make room for the chevron icon */
}

/* Size Variants */
.select-sm {
  @apply px-3 py-1.5 text-sm;
}

.select-md {
  @apply px-4 py-2.5 text-base;
}

.select-lg {
  @apply px-5 py-3 text-lg;
}

/* Disabled State */
.form-select:disabled {
  @apply bg-gray-50 text-gray-500 cursor-not-allowed;
  @apply border-gray-200;
}

/* Error State */
.select-error {
  @apply border-red-300 focus:ring-red-500;
}

/* Chevron Icon */
.select-icon {
  @apply absolute right-3 top-1/2 transform -translate-y-1/2;
  @apply text-gray-400 pointer-events-none;
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
.form-select:focus {
  @apply shadow-sm;
}
</style>
