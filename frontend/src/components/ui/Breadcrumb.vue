<template>
  <nav class="flex" aria-label="Breadcrumb">
    <ol class="inline-flex items-center space-x-1 md:space-x-3">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="inline-flex items-center"
      >
        <!-- Separator -->
        <svg
          v-if="index > 0"
          class="w-6 h-6 text-gray-400 mx-1"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clip-rule="evenodd"
          ></path>
        </svg>

        <!-- Home Icon for first item -->
        <svg
          v-if="index === 0 && showHomeIcon"
          class="w-4 h-4 mr-2 text-gray-400"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
          ></path>
        </svg>

        <!-- Link or Text -->
        <router-link
          v-if="item.to && index !== items.length - 1"
          :to="item.to"
          class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          :aria-current="index === items.length - 1 ? 'page' : undefined"
        >
          {{ item.label }}
        </router-link>
        <span
          v-else
          class="inline-flex items-center text-sm font-medium"
          :class="index === items.length - 1 ? 'text-gray-500' : 'text-gray-700'"
          :aria-current="index === items.length - 1 ? 'page' : undefined"
        >
          {{ item.label }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
    validator: (items) => {
      return items.every(item => item.label)
    }
  },
  showHomeIcon: {
    type: Boolean,
    default: true
  }
})
</script>
