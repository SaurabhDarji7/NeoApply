<template>
  <nav aria-label="Breadcrumb" class="breadcrumbs">
    <ol class="breadcrumbs-list">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="breadcrumbs-item"
      >
        <router-link
          v-if="item.to && index !== items.length - 1"
          :to="item.to"
          class="breadcrumbs-link"
        >
          {{ item.label }}
        </router-link>
        <span
          v-else
          :class="['breadcrumbs-current', { 'text-gray-900 font-medium': index === items.length - 1 }]"
          :aria-current="index === items.length - 1 ? 'page' : undefined"
        >
          {{ item.label }}
        </span>
        <span v-if="index < items.length - 1" class="breadcrumbs-separator">
          <slot name="separator">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
            </svg>
          </slot>
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    required: true
    // Example: [{ label: 'Home', to: '/' }, { label: 'Resumes', to: '/resumes' }, { label: 'Details' }]
  }
})
</script>

<style scoped>
.breadcrumbs {
  @apply text-sm;
}

.breadcrumbs-list {
  @apply flex items-center flex-wrap gap-1;
}

.breadcrumbs-item {
  @apply flex items-center;
}

.breadcrumbs-link {
  @apply text-primary-600 hover:text-primary-700;
  @apply transition-colors duration-200;
  @apply hover:underline;
}

.breadcrumbs-current {
  @apply text-gray-500;
}

.breadcrumbs-separator {
  @apply text-gray-400 mx-1;
  @apply flex items-center;
}
</style>
