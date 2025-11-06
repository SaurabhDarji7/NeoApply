# Humi HR - Design System Analysis & Extension Guide

## Executive Summary

This document provides a comprehensive analysis of Humi HR's design philosophy and UI/UX patterns, with recommendations for extending these patterns in NeoApply. Humi's design is characterized by **simplicity, warmth, and user-friendliness** - a deliberate departure from typical tech platforms that prioritize cold efficiency over human connection.

---

## 1. Humi's Core Design Philosophy

### 1.1 Design Principles

**Simplicity Over Complexity**
- Clean, clutter-free interfaces that focus user attention
- Maximum 3 clicks to reach any destination in the platform
- Streamlined navigation that acts as a "map" for the entire product
- Minimal cognitive load for both tech-savvy and non-technical users

**Human-Centered Design**
- Warm, approachable aesthetic (vs. cold, corporate tech)
- Centralized around the employee experience
- Focus on making users feel care and warmth
- Accessible to all skill levels

**Unity Through Centralization**
- Single employee profile containing all necessary information
- Consolidated data views to reduce context switching
- Cohesive experience across all modules

**Functional Minimalism**
- Every element serves a purpose
- No decorative bloat or unnecessary features
- Progressive disclosure of complexity

---

## 2. Visual Design System

### 2.1 Typography

**Primary Typefaces:**

1. **Calibre** (Display/Headlines)
   - Usage: Large headlines, hero text, page titles
   - Characteristics: Friendly, welcoming character while remaining clear and simple
   - Purpose: Creates warm first impressions and guides user attention

2. **Untitled Sans** (Body/UI)
   - Usage: Body text, UI components, data tables, forms
   - Characteristics: Exceptional legibility at small sizes
   - Purpose: Ensures readability in complex data-heavy interfaces

**Typographic Scale:**
- Defined text sizes with consistent letter spacing
- Standardized line heights for optimal readability
- Font weight variations for hierarchy (regular, medium, semibold, bold)
- Guidelines ensure consistency across brand and product

**Recommendations for NeoApply:**
```css
/* Typography System Inspired by Humi */
--font-display: 'Inter', 'Calibre-like', sans-serif;  /* For headlines */
--font-body: 'Inter', 'Untitled Sans-like', sans-serif;  /* For content */

/* Type Scale */
--text-xs: 0.75rem;      /* 12px - labels, captions */
--text-sm: 0.875rem;     /* 14px - secondary text */
--text-base: 1rem;       /* 16px - body text */
--text-lg: 1.125rem;     /* 18px - emphasized text */
--text-xl: 1.25rem;      /* 20px - small headings */
--text-2xl: 1.5rem;      /* 24px - section headings */
--text-3xl: 1.875rem;    /* 30px - page titles */
--text-4xl: 2.25rem;     /* 36px - hero text */
```

### 2.2 Color Palette

**Evolution:**
- **Before:** Typical "tech-blue" palette (rational but cold)
- **After:** Warmer, more approachable colors that convey care

**Humi's Color Strategy:**
- Primary colors that feel warm and human
- Purposeful use of color for status and categorization
- Sufficient contrast for accessibility
- Emotional resonance over pure aesthetic

**Recommended Color System for NeoApply:**

```css
/* Warm, Human-Centered Palette */

/* Primary - Warm Blues (vs. cold tech blue) */
--primary-50: #EFF6FF;
--primary-100: #DBEAFE;
--primary-500: #3B82F6;   /* Current - could be warmed */
--primary-600: #2563EB;
--primary-700: #1D4ED8;

/* Secondary - Warm Greens (success, completion) */
--secondary-50: #ECFDF5;
--secondary-100: #D1FAE5;
--secondary-500: #10B981;  /* Current */
--secondary-600: #059669;

/* Accent - Warm Coral/Orange (friendly actions) */
--accent-50: #FFF7ED;
--accent-100: #FFEDD5;
--accent-500: #F97316;
--accent-600: #EA580C;

/* Semantic Colors */
--success: #10B981;        /* Green - completion */
--warning: #F59E0B;        /* Amber - caution */
--danger: #EF4444;         /* Red - errors */
--info: #3B82F6;           /* Blue - information */

/* Neutrals - Warm Grays */
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-400: #9CA3AF;
--gray-500: #6B7280;
--gray-600: #4B5563;
--gray-700: #374151;
--gray-800: #1F2937;
--gray-900: #111827;
```

### 2.3 Spacing & Layout

**Humi's Approach:**
- Generous white space to reduce cognitive load
- Consistent spacing scale for visual rhythm
- Clear visual hierarchy through spacing

**Recommended Spacing System:**

```css
/* Spacing Scale (8px base) */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */

/* Container Widths */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
```

---

## 3. Component Patterns

### 3.1 Cards

**Humi's Card Philosophy:**
- Multiple card types for different data contexts
- Cards prevent empty states from feeling barren
- Visual categorization through consistent styling

**Card Types in Humi:**
1. **Department Cards** - Team/organizational units
2. **Profile Cards** - Employee information
3. **Applicant Cards** - Recruitment pipeline
4. **Upcoming Events Cards** - Calendar/scheduling
5. **Status Cards** - Dashboard metrics

**Recommended Card Pattern for NeoApply:**

```vue
<!-- Base Card Component -->
<template>
  <div class="card" :class="cardVariant">
    <div v-if="hasHeader" class="card-header">
      <slot name="header"></slot>
    </div>
    <div class="card-body">
      <slot></slot>
    </div>
    <div v-if="hasFooter" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<style scoped>
.card {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden;
  transition: all 0.2s ease-in-out;
}

.card:hover {
  @apply shadow-md;
}

.card-header {
  @apply px-6 py-4 border-b border-gray-200 bg-gray-50;
}

.card-body {
  @apply px-6 py-5;
}

.card-footer {
  @apply px-6 py-4 border-t border-gray-200 bg-gray-50;
}

/* Card Variants */
.card-elevated {
  @apply shadow-md;
}

.card-flat {
  @apply shadow-none border-0;
}

.card-interactive {
  @apply cursor-pointer hover:shadow-lg hover:border-primary-300;
}
</style>
```

**Application in NeoApply:**
- **Resume Cards** - Display parsed resume data
- **Job Cards** - Show job listings
- **Template Cards** - Template library items
- **Dashboard Stat Cards** - Metrics and KPIs
- **Activity Cards** - Recent actions/notifications

### 3.2 Buttons

**Humi's Button Evolution:**
- Introduced **Floating Action Buttons (FABs)** for primary actions
- FABs appear in front of all screen content
- Perform the primary or most common action on a screen
- Updated all buttons to align with new branding

**Button Hierarchy:**

```vue
<!-- Button Component with Humi-inspired patterns -->
<template>
  <button :class="buttonClasses" :disabled="disabled || loading">
    <span v-if="loading" class="btn-spinner"></span>
    <slot></slot>
  </button>
</template>

<style scoped>
/* Primary Action - Most important */
.btn-primary {
  @apply bg-primary-600 text-white font-medium px-5 py-2.5 rounded-lg;
  @apply hover:bg-primary-700 active:bg-primary-800;
  @apply transition-all duration-200 ease-in-out;
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
}

/* Secondary Action - Alternative action */
.btn-secondary {
  @apply bg-white text-gray-700 font-medium px-5 py-2.5 rounded-lg;
  @apply border border-gray-300 hover:bg-gray-50 active:bg-gray-100;
  @apply transition-all duration-200 ease-in-out;
  @apply focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2;
}

/* Tertiary/Ghost - Low emphasis */
.btn-ghost {
  @apply bg-transparent text-gray-700 font-medium px-5 py-2.5 rounded-lg;
  @apply hover:bg-gray-100 active:bg-gray-200;
  @apply transition-all duration-200 ease-in-out;
}

/* Danger/Destructive - Delete, remove */
.btn-danger {
  @apply bg-red-600 text-white font-medium px-5 py-2.5 rounded-lg;
  @apply hover:bg-red-700 active:bg-red-800;
  @apply transition-all duration-200 ease-in-out;
  @apply focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2;
}

/* Floating Action Button (FAB) - Primary screen action */
.btn-fab {
  @apply fixed bottom-8 right-8 w-14 h-14 rounded-full;
  @apply bg-primary-600 text-white shadow-lg;
  @apply hover:bg-primary-700 hover:shadow-xl;
  @apply flex items-center justify-center;
  @apply transition-all duration-300 ease-in-out;
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
  z-index: 50;
}

.btn-fab:hover {
  transform: scale(1.05);
}

/* Sizes */
.btn-sm {
  @apply px-3 py-1.5 text-sm;
}

.btn-lg {
  @apply px-6 py-3 text-lg;
}

/* States */
.btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}
</style>
```

**FAB Usage in NeoApply:**
- **Resumes View:** Upload new resume (floating +)
- **Jobs View:** Add new job description
- **Templates View:** Create new template
- **Dashboard:** Quick action menu

### 3.3 Status Tags & Badges

**Humi Pattern:**
- Status tags for easy categorization
- Colors for quick recognition of different information
- Consistent across all views

**Recommended Status Tag System:**

```vue
<template>
  <span class="tag" :class="tagVariant">
    <span v-if="withDot" class="tag-dot"></span>
    <slot></slot>
  </span>
</template>

<style scoped>
.tag {
  @apply inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full;
  @apply text-xs font-medium;
  @apply transition-all duration-200;
}

/* Status Variants */
.tag-success {
  @apply bg-green-50 text-green-700 border border-green-200;
}

.tag-warning {
  @apply bg-amber-50 text-amber-700 border border-amber-200;
}

.tag-danger {
  @apply bg-red-50 text-red-700 border border-red-200;
}

.tag-info {
  @apply bg-blue-50 text-blue-700 border border-blue-200;
}

.tag-neutral {
  @apply bg-gray-50 text-gray-700 border border-gray-200;
}

/* Category Tags (for skills, tags, etc.) */
.tag-frontend {
  @apply bg-blue-100 text-blue-800;
}

.tag-backend {
  @apply bg-green-100 text-green-800;
}

.tag-database {
  @apply bg-purple-100 text-purple-800;
}

.tag-devops {
  @apply bg-orange-100 text-orange-800;
}

/* Dot indicator */
.tag-dot {
  @apply w-1.5 h-1.5 rounded-full bg-current;
}
</style>
```

**Applications:**
- Resume status (parsing, parsed, failed)
- Job posting status (active, draft, closed)
- Application status (applied, interviewing, offered)
- Skill categories (frontend, backend, etc.)

### 3.4 Forms & Inputs

**Humi's Form Design:**
- Clean, minimal form fields
- Clear labels and helpful placeholders
- Inline validation with friendly messaging
- Logical grouping and progressive disclosure

**Recommended Input Pattern:**

```vue
<template>
  <div class="form-field">
    <label v-if="label" :for="inputId" class="form-label">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <div class="input-wrapper">
      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="inputClasses"
        @input="$emit('update:modelValue', $event.target.value)"
      />

      <div v-if="icon" class="input-icon">
        <slot name="icon"></slot>
      </div>
    </div>

    <p v-if="hint && !error" class="form-hint">{{ hint }}</p>
    <p v-if="error" class="form-error">{{ error }}</p>
  </div>
</template>

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

.form-input {
  @apply w-full px-4 py-2.5 rounded-lg border border-gray-300;
  @apply bg-white text-gray-900 placeholder-gray-400;
  @apply transition-all duration-200;
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent;
}

.form-input:disabled {
  @apply bg-gray-50 text-gray-500 cursor-not-allowed;
}

.form-input.error {
  @apply border-red-300 focus:ring-red-500;
}

.form-hint {
  @apply text-xs text-gray-500;
}

.form-error {
  @apply text-xs text-red-600;
}

.input-icon {
  @apply absolute right-3 top-1/2 transform -translate-y-1/2;
  @apply text-gray-400;
}
</style>
```

### 3.5 Navigation

**Humi's Navigation Principles:**
- Left-aligned navigation bar (acts as product "map")
- Maximum 3 clicks to any destination
- Clear, labeled sections
- Active state clearly indicated

**Recommended Navigation Pattern:**

```vue
<template>
  <nav class="sidebar">
    <div class="sidebar-header">
      <img :src="logo" alt="Logo" class="sidebar-logo" />
    </div>

    <ul class="sidebar-nav">
      <li v-for="item in navItems" :key="item.path">
        <router-link
          :to="item.path"
          class="nav-item"
          :class="{ 'active': isActive(item.path) }"
        >
          <component :is="item.icon" class="nav-icon" />
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </li>
    </ul>

    <div class="sidebar-footer">
      <slot name="footer"></slot>
    </div>
  </nav>
</template>

<style scoped>
.sidebar {
  @apply fixed left-0 top-0 h-screen w-64;
  @apply bg-white border-r border-gray-200;
  @apply flex flex-col;
}

.sidebar-header {
  @apply px-6 py-5 border-b border-gray-200;
}

.sidebar-nav {
  @apply flex-1 px-3 py-4 space-y-1 overflow-y-auto;
}

.nav-item {
  @apply flex items-center gap-3 px-3 py-2.5 rounded-lg;
  @apply text-gray-700 font-medium text-sm;
  @apply transition-all duration-200;
  @apply hover:bg-gray-100;
}

.nav-item.active {
  @apply bg-primary-50 text-primary-700;
}

.nav-icon {
  @apply w-5 h-5;
}

.sidebar-footer {
  @apply px-6 py-4 border-t border-gray-200;
}
</style>
```

---

## 4. Empty States & Data Visualization

### 4.1 Empty States

**Humi's Approach:**
- Uses cards to prevent empty areas from feeling barren
- Helpful messaging with clear next actions
- Friendly illustrations or icons
- Onboarding hints for new users

**Recommended Empty State Pattern:**

```vue
<template>
  <div class="empty-state">
    <div class="empty-state-icon">
      <slot name="icon">
        <svg><!-- Default icon --></svg>
      </slot>
    </div>

    <h3 class="empty-state-title">{{ title }}</h3>
    <p class="empty-state-description">{{ description }}</p>

    <div v-if="action" class="empty-state-action">
      <button class="btn-primary" @click="$emit('action')">
        {{ actionLabel }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  @apply flex flex-col items-center justify-center;
  @apply px-6 py-12 text-center;
}

.empty-state-icon {
  @apply w-16 h-16 mb-4 text-gray-400;
}

.empty-state-title {
  @apply text-lg font-semibold text-gray-900 mb-2;
}

.empty-state-description {
  @apply text-sm text-gray-500 max-w-md mb-6;
}
</style>
```

**Applications in NeoApply:**
- No resumes uploaded yet
- No jobs added
- No templates created
- Empty search results

### 4.2 Data Tables

**Humi Pattern:**
- Clean, scannable tables
- Appropriate use of cards for limited data
- Status indicators integrated into rows
- Action menus accessible but unobtrusive

```css
/* Table Styling */
.table {
  @apply w-full border-collapse;
}

.table thead {
  @apply bg-gray-50 border-b border-gray-200;
}

.table th {
  @apply px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider;
}

.table tbody {
  @apply bg-white divide-y divide-gray-200;
}

.table td {
  @apply px-6 py-4 text-sm text-gray-900;
}

.table tr:hover {
  @apply bg-gray-50 transition-colors duration-150;
}
```

---

## 5. Interaction Patterns

### 5.1 Feedback & Notifications

**Humi's Approach:**
- Immediate, clear feedback for all actions
- Non-intrusive toast notifications
- Success states that build confidence

**Recommended Toast Pattern:**

```vue
<template>
  <transition name="toast">
    <div v-if="visible" class="toast" :class="toastVariant">
      <div class="toast-icon">
        <component :is="icon" />
      </div>
      <div class="toast-content">
        <p class="toast-title">{{ title }}</p>
        <p v-if="message" class="toast-message">{{ message }}</p>
      </div>
      <button @click="close" class="toast-close">
        <svg><!-- Close icon --></svg>
      </button>
    </div>
  </transition>
</template>

<style scoped>
.toast {
  @apply fixed top-4 right-4 max-w-md;
  @apply bg-white rounded-lg shadow-lg border;
  @apply flex items-start gap-3 p-4;
  @apply transition-all duration-300;
  z-index: 9999;
}

.toast-success {
  @apply border-green-200 bg-green-50;
}

.toast-error {
  @apply border-red-200 bg-red-50;
}

.toast-info {
  @apply border-blue-200 bg-blue-50;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>
```

### 5.2 Loading States

**Principles:**
- Clear indication of progress
- Contextual loading (where relevant)
- Skeleton screens for content-heavy areas
- Prevent layout shifts

**Current NeoApply Implementation:**
- Good: Multiple loading state types (spinner, parsing, scraping, skeleton, progress)
- Enhancement: Add skeleton screens for cards and lists

```css
/* Skeleton Loading Pattern */
.skeleton {
  @apply bg-gray-200 animate-pulse rounded;
}

.skeleton-text {
  @apply h-4 bg-gray-200 rounded animate-pulse;
}

.skeleton-heading {
  @apply h-6 bg-gray-200 rounded animate-pulse;
}

.skeleton-card {
  @apply bg-white rounded-lg shadow p-6 space-y-4;
}
```

### 5.3 Micro-interactions

**Humi's Attention to Detail:**
- Smooth transitions between states
- Hover effects that provide affordance
- Button press animations
- Satisfying completion animations

```css
/* Micro-interactions */
.interactive {
  @apply transition-all duration-200 ease-in-out;
}

.interactive:hover {
  @apply transform scale-105;
}

.interactive:active {
  @apply transform scale-95;
}

/* Smooth fade transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
```

---

## 6. Extending Humi Patterns in NeoApply

### 6.1 Current State Analysis

**Strengths (Already Aligned with Humi):**
- ✅ Clean, utility-first approach with TailwindCSS
- ✅ Component-based architecture
- ✅ Multiple loading states with context
- ✅ Comprehensive error handling with suggestions
- ✅ Card-based layouts for data
- ✅ Color-coded skill categories

**Gaps (Opportunities for Humi-inspired Improvements):**
- ❌ No success toast notifications (actions complete silently)
- ❌ Missing onboarding for new users
- ❌ Generic confirmation dialogs (JS confirm vs. styled modals)
- ❌ Navigation could be more streamlined (3-click rule)
- ❌ No FABs for primary actions
- ❌ Limited empty state designs
- ❌ Inconsistent status tags

### 6.2 Priority Enhancements

#### **Phase 1: Core UX Improvements (Week 1-2)**

1. **Implement Toast Notification System**
   - File: `src/components/common/Toast.vue`
   - Use cases: Resume uploaded, job parsed, template saved, errors
   - Success, error, info, warning variants

2. **Add Floating Action Buttons**
   - Resumes page: "Upload Resume" FAB
   - Jobs page: "Add Job" FAB
   - Templates page: "Create Template" FAB
   - Maintains Humi's principle of highlighting primary actions

3. **Enhance Empty States**
   - File: `src/components/common/EmptyState.vue`
   - Friendly illustrations
   - Clear calls-to-action
   - Helpful onboarding hints

4. **Create Status Tag Component**
   - File: `src/components/common/StatusTag.vue`
   - Standardized across all views
   - Color-coded for quick recognition

#### **Phase 2: Navigation & Information Architecture (Week 3-4)**

1. **Streamline Navigation**
   - Audit current navigation paths
   - Ensure 3-click maximum rule
   - Add breadcrumbs for deep pages
   - Clear active states

2. **Implement Onboarding Flow**
   - First-time user tour
   - Progressive disclosure of features
   - Contextual help tooltips
   - Empty state CTAs

3. **Add Search & Filter**
   - Resume search by name, skills
   - Job search by title, company
   - Template filtering
   - Maintains Humi's simplicity while adding power

#### **Phase 3: Polish & Refinement (Week 5-6)**

1. **Typography Enhancement**
   - Implement two-font system (display + body)
   - Refine type scale
   - Improve readability in data-dense areas

2. **Color System Refinement**
   - Warm up primary blue
   - Add accent colors for variety
   - Ensure WCAG AA compliance
   - Semantic color naming

3. **Micro-interactions**
   - Smooth transitions
   - Hover states
   - Button press animations
   - Loading state transitions

4. **Modal & Dialog Components**
   - Replace JS confirm() with styled modals
   - Confirmation dialogs for destructive actions
   - Form modals for quick actions

---

## 7. Component Library Roadmap

### 7.1 Essential Components (Humi-inspired)

**Layout Components:**
- ✅ `Card.vue` - Basic card (exists, enhance)
- 🆕 `PageHeader.vue` - Consistent page titles with actions
- 🆕 `ContentContainer.vue` - Max-width wrapper with consistent padding
- 🆕 `Sidebar.vue` - Left navigation (Humi pattern)

**Form Components:**
- ✅ `FileUpload.vue` - Drag-and-drop (exists)
- 🆕 `Input.vue` - Text inputs with validation
- 🆕 `Select.vue` - Dropdown select
- 🆕 `Checkbox.vue` - Checkbox input
- 🆕 `Radio.vue` - Radio button
- 🆕 `Toggle.vue` - Switch/toggle
- 🆕 `FormField.vue` - Wrapper with label, hint, error

**Feedback Components:**
- ✅ `LoadingStates.vue` - Loading indicators (exists, enhance)
- ✅ `ErrorDisplay.vue` - Error messages (exists)
- 🆕 `Toast.vue` - Toast notifications **[HIGH PRIORITY]**
- 🆕 `EmptyState.vue` - Empty state placeholder **[HIGH PRIORITY]**
- 🆕 `SuccessMessage.vue` - Success confirmations

**Action Components:**
- 🆕 `Button.vue` - All button variants **[HIGH PRIORITY]**
- 🆕 `FAB.vue` - Floating action button **[HIGH PRIORITY]**
- 🆕 `IconButton.vue` - Icon-only buttons
- 🆕 `ButtonGroup.vue` - Related button groups

**Data Display Components:**
- 🆕 `StatusTag.vue` - Status badges **[HIGH PRIORITY]**
- 🆕 `Table.vue` - Data table
- 🆕 `List.vue` - List with items
- 🆕 `Badge.vue` - Count/notification badges
- 🆕 `Avatar.vue` - User avatars

**Navigation Components:**
- 🆕 `NavBar.vue` - Top navigation
- 🆕 `NavItem.vue` - Navigation items
- 🆕 `Breadcrumbs.vue` - Breadcrumb navigation
- 🆕 `Tabs.vue` - Tab navigation

**Overlay Components:**
- 🆕 `Modal.vue` - Modal dialogs **[HIGH PRIORITY]**
- 🆕 `Drawer.vue` - Side drawer/panel
- 🆕 `Dropdown.vue` - Dropdown menu
- 🆕 `Tooltip.vue` - Contextual tooltips
- 🆕 `Popover.vue` - Popover content

### 7.2 Implementation Strategy

**Step 1: Create Base Components (Week 1)**
```
/src/components/ui/
  ├── Button.vue
  ├── Card.vue (enhance existing)
  ├── Input.vue
  ├── Toast.vue
  └── StatusTag.vue
```

**Step 2: Implement Composables (Week 1)**
```
/src/composables/
  ├── useToast.js
  ├── useModal.js
  └── useLoading.js
```

**Step 3: Refactor Existing Components (Week 2-3)**
- Update `ParsedResumeDisplay.vue` to use new components
- Update `ParsedJobDisplay.vue` to use new components
- Update views to use standardized patterns

**Step 4: Documentation (Ongoing)**
- Create component examples
- Document props and events
- Add usage guidelines

---

## 8. Design Tokens

### 8.1 Token System (Humi-inspired)

**Create:** `/src/assets/tokens.css`

```css
:root {
  /* ========================================
     TYPOGRAPHY
     ======================================== */

  /* Font Families */
  --font-display: 'Inter', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'Fira Code', monospace;

  /* Font Sizes */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
  --text-4xl: 2.25rem;     /* 36px */

  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;

  /* ========================================
     COLORS
     ======================================== */

  /* Primary (Warm Blue) */
  --color-primary-50: #EFF6FF;
  --color-primary-100: #DBEAFE;
  --color-primary-200: #BFDBFE;
  --color-primary-300: #93C5FD;
  --color-primary-400: #60A5FA;
  --color-primary-500: #3B82F6;
  --color-primary-600: #2563EB;
  --color-primary-700: #1D4ED8;
  --color-primary-800: #1E40AF;
  --color-primary-900: #1E3A8A;

  /* Secondary (Warm Green) */
  --color-secondary-50: #ECFDF5;
  --color-secondary-100: #D1FAE5;
  --color-secondary-500: #10B981;
  --color-secondary-600: #059669;
  --color-secondary-700: #047857;

  /* Accent (Warm Coral) */
  --color-accent-50: #FFF7ED;
  --color-accent-100: #FFEDD5;
  --color-accent-500: #F97316;
  --color-accent-600: #EA580C;

  /* Semantic */
  --color-success: var(--color-secondary-500);
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  --color-info: var(--color-primary-500);

  /* Neutrals */
  --color-gray-50: #F9FAFB;
  --color-gray-100: #F3F4F6;
  --color-gray-200: #E5E7EB;
  --color-gray-300: #D1D5DB;
  --color-gray-400: #9CA3AF;
  --color-gray-500: #6B7280;
  --color-gray-600: #4B5563;
  --color-gray-700: #374151;
  --color-gray-800: #1F2937;
  --color-gray-900: #111827;

  /* ========================================
     SPACING
     ======================================== */

  --space-0: 0;
  --space-1: 0.25rem;    /* 4px */
  --space-2: 0.5rem;     /* 8px */
  --space-3: 0.75rem;    /* 12px */
  --space-4: 1rem;       /* 16px */
  --space-5: 1.25rem;    /* 20px */
  --space-6: 1.5rem;     /* 24px */
  --space-8: 2rem;       /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */
  --space-24: 6rem;      /* 96px */

  /* ========================================
     BORDER RADIUS
     ======================================== */

  --radius-sm: 0.375rem;    /* 6px */
  --radius-md: 0.5rem;      /* 8px */
  --radius-lg: 0.75rem;     /* 12px */
  --radius-xl: 1rem;        /* 16px */
  --radius-full: 9999px;

  /* ========================================
     SHADOWS
     ======================================== */

  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);

  /* ========================================
     TRANSITIONS
     ======================================== */

  --transition-fast: 150ms ease-in-out;
  --transition-normal: 200ms ease-in-out;
  --transition-slow: 300ms ease-in-out;

  /* ========================================
     Z-INDEX
     ======================================== */

  --z-dropdown: 1000;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
  --z-toast: 9999;
}
```

### 8.2 Tailwind Config Update

**Update:** `/frontend/tailwind.config.js`

```javascript
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        secondary: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        accent: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          500: '#F97316',
          600: '#EA580C',
        },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
}
```

---

## 9. Accessibility (Humi Standard)

### 9.1 WCAG 2.1 AA Compliance

**Color Contrast:**
- Text: Minimum 4.5:1 ratio
- Large text (18pt+): Minimum 3:1 ratio
- Interactive elements: Minimum 3:1 ratio

**Keyboard Navigation:**
- All interactive elements focusable
- Logical tab order
- Visible focus indicators
- Escape key closes overlays

**Screen Reader Support:**
- Semantic HTML elements
- ARIA labels where needed
- Alt text for images
- Live regions for dynamic content

### 9.2 Implementation Checklist

```vue
<!-- Accessible Button Example -->
<button
  class="btn-primary"
  type="button"
  :aria-label="ariaLabel"
  :aria-pressed="isPressed"
  :disabled="disabled"
  @click="handleClick"
  @keydown.enter="handleClick"
  @keydown.space.prevent="handleClick"
>
  <slot></slot>
</button>

<!-- Accessible Form Example -->
<div class="form-field">
  <label :for="inputId" class="form-label">
    {{ label }}
    <span v-if="required" aria-label="required">*</span>
  </label>
  <input
    :id="inputId"
    :type="type"
    :aria-describedby="hintId"
    :aria-invalid="!!error"
    :required="required"
  />
  <p v-if="hint" :id="hintId" class="form-hint">{{ hint }}</p>
  <p v-if="error" role="alert" class="form-error">{{ error }}</p>
</div>
```

---

## 10. Performance Considerations

### 10.1 Humi's Lightweight Philosophy

- Minimal JavaScript payload
- CSS optimization (Tailwind purging)
- Lazy loading of routes and components
- Optimized images and assets
- Fast initial load times

### 10.2 Optimization Strategy for NeoApply

**1. Code Splitting:**
```javascript
// router/index.js
const routes = [
  {
    path: '/dashboard',
    component: () => import('../views/DashboardView.vue')
  }
]
```

**2. Component Lazy Loading:**
```vue
<script setup>
import { defineAsyncComponent } from 'vue'

const TemplateEditor = defineAsyncComponent(() =>
  import('./components/template/TemplateEditor.vue')
)
</script>
```

**3. Tailwind Purging:**
```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  // Automatically purges unused CSS
}
```

**4. Image Optimization:**
- Use WebP format with fallbacks
- Lazy load images below fold
- Appropriate sizing for different viewports

---

## 11. Implementation Timeline

### Week 1-2: Foundation
- [ ] Set up design tokens
- [ ] Create base components (Button, Card, Input, StatusTag)
- [ ] Implement Toast notification system
- [ ] Add Floating Action Buttons

### Week 3-4: Enhancement
- [ ] Build EmptyState component
- [ ] Create Modal component (replace JS confirm)
- [ ] Implement onboarding flow
- [ ] Add search/filter functionality

### Week 5-6: Polish
- [ ] Refine typography system
- [ ] Enhance micro-interactions
- [ ] Accessibility audit and fixes
- [ ] Performance optimization

### Week 7-8: Documentation & Testing
- [ ] Component documentation
- [ ] Usage guidelines
- [ ] User testing
- [ ] Iteration based on feedback

---

## 12. Success Metrics

### User Experience Metrics
- **Time to Complete Task:** Reduce by 30%
- **Click Depth:** Maximum 3 clicks to any feature
- **Error Recovery:** Clear path in 100% of error states
- **First-Time Success:** 80%+ completion without help

### Technical Metrics
- **Page Load Time:** < 2 seconds
- **Time to Interactive:** < 3 seconds
- **Lighthouse Score:** 90+ (Performance, Accessibility)
- **Bundle Size:** < 300KB (gzipped)

### Adoption Metrics
- **Feature Discovery:** 70%+ users discover key features
- **User Satisfaction:** 4.5+ / 5 rating
- **Support Requests:** Reduce by 40%
- **User Retention:** Increase by 25%

---

## 13. Resources & References

### Humi Insights
- [Humi's Visual Identity](https://www.humi.ca/blog-post/our-new-visual-identity)
- [What to Expect from Humi 2](https://medium.com/humihr/what-to-expect-from-humi-2-a3ee426d4f45)

### Design Systems & Patterns
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Vue 3 Component Patterns](https://vuejs.org/guide/components)
- [Material Design 3](https://m3.material.io)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines)

### Accessibility
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [A11y Project](https://www.a11yproject.com)

### Performance
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

---

## 14. Conclusion

Humi HR's design philosophy centers on **simplicity, warmth, and user-friendliness**. By adopting their patterns—clean interfaces, minimal clicks, helpful feedback, and human-centered design—NeoApply can significantly enhance user experience while maintaining the technical sophistication that powers the platform.

The key is to **start small, iterate frequently, and always prioritize the user's needs over feature complexity**. Every design decision should answer: "Does this make the user's job easier or harder?"

### Next Steps

1. **Review this document** with the development team
2. **Prioritize components** based on impact and effort
3. **Create prototypes** of key patterns (Toast, FAB, Modal)
4. **User test** with real users for feedback
5. **Implement iteratively** following the phased approach
6. **Document learnings** and update this guide

---

**Document Version:** 1.0
**Last Updated:** 2025-11-06
**Maintained By:** NeoApply Development Team
