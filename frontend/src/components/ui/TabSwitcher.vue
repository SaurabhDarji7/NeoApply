<template>
  <div class="w-full">
    <!-- Tab Navigation -->
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex space-x-8" aria-label="Tabs" role="tablist">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="selectTab(tab.value)"
          :class="tabClasses(tab.value)"
          :aria-selected="modelValue === tab.value"
          :aria-controls="`panel-${tab.value}`"
          role="tab"
          type="button"
        >
          <!-- Icon (if provided) -->
          <component
            v-if="tab.icon"
            :is="tab.icon"
            class="h-5 w-5 mr-2"
            aria-hidden="true"
          />
          <span>{{ tab.label }}</span>

          <!-- Badge (if provided) -->
          <BaseBadge
            v-if="tab.badge"
            :variant="tab.badgeVariant || 'default'"
            size="sm"
            class="ml-2"
          >
            {{ tab.badge }}
          </BaseBadge>
        </button>
      </nav>
    </div>

    <!-- Tab Panels -->
    <div class="mt-4">
      <div
        v-for="tab in tabs"
        :key="tab.value"
        v-show="modelValue === tab.value"
        :id="`panel-${tab.value}`"
        role="tabpanel"
        :aria-labelledby="`tab-${tab.value}`"
      >
        <slot :name="tab.value">
          <!-- Default slot content for this tab -->
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseBadge from './BaseBadge.vue'

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  tabs: {
    type: Array,
    required: true,
    validator: (tabs) => {
      return tabs.every(tab => tab.value && tab.label)
    }
  }
})

const emit = defineEmits(['update:modelValue'])

const selectTab = (value) => {
  emit('update:modelValue', value)
}

const tabClasses = (tabValue) => {
  const isActive = props.modelValue === tabValue

  const baseClasses = [
    'group',
    'inline-flex',
    'items-center',
    'py-4',
    'px-1',
    'border-b-2',
    'font-medium',
    'text-sm',
    'transition-colors',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'focus:ring-blue-500',
    'cursor-pointer'
  ]

  const activeClasses = [
    'border-blue-500',
    'text-blue-600'
  ]

  const inactiveClasses = [
    'border-transparent',
    'text-gray-500',
    'hover:text-gray-700',
    'hover:border-gray-300'
  ]

  return [
    ...baseClasses,
    ...(isActive ? activeClasses : inactiveClasses)
  ].join(' ')
}
</script>
