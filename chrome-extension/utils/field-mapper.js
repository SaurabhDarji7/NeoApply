// Field mapping utilities for ATS form detection
import { DEBUG } from './config.js';

/**
 * Normalize text for field matching (lowercase, remove special chars, trim)
 * @param {string} text
 * @returns {string}
 */
function normalizeText(text) {
  if (!text) return '';
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

/**
 * Get label text for an input element
 * @param {HTMLElement} input
 * @returns {string|null}
 */
export function getLabelText(input) {
  // Try multiple methods to find label
  const id = input.id;
  const name = input.name;

  // 1. Label with 'for' attribute
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return label.textContent.trim();
  }

  // 2. Wrapped in label
  const parentLabel = input.closest('label');
  if (parentLabel) {
    return parentLabel.textContent.replace(input.value || '', '').trim();
  }

  // 3. aria-label
  if (input.getAttribute('aria-label')) {
    return input.getAttribute('aria-label');
  }

  // 4. placeholder
  if (input.placeholder) {
    return input.placeholder;
  }

  // 5. Previous sibling label
  let prev = input.previousElementSibling;
  while (prev) {
    if (prev.tagName === 'LABEL') {
      return prev.textContent.trim();
    }
    prev = prev.previousElementSibling;
  }

  // 6. data-qa or data-test attributes
  const dataQa = input.getAttribute('data-qa') || input.getAttribute('data-test');
  if (dataQa) return dataQa;

  return null;
}

/**
 * Field type definitions with matching keywords
 */
const FIELD_TYPES = {
  firstName: {
    keywords: ['first name', 'given name', 'firstname', 'fname'],
    names: ['first_name', 'firstName', 'fname', 'given_name']
  },
  lastName: {
    keywords: ['last name', 'surname', 'family name', 'lastname', 'lname'],
    names: ['last_name', 'lastName', 'lname', 'family_name', 'surname']
  },
  fullName: {
    keywords: ['full name', 'name', 'your name'],
    names: ['name', 'full_name', 'fullName']
  },
  email: {
    keywords: ['email', 'e-mail', 'email address'],
    names: ['email', 'email_address', 'emailAddress']
  },
  phone: {
    keywords: ['phone', 'telephone', 'mobile', 'phone number', 'contact number'],
    names: ['phone', 'phone_number', 'phoneNumber', 'telephone', 'mobile']
  },
  linkedin: {
    keywords: ['linkedin', 'linkedin profile', 'linkedin url'],
    names: ['linkedin', 'urls[LinkedIn]', 'linkedin_url', 'linkedinUrl']
  },
  github: {
    keywords: ['github', 'github profile', 'github url'],
    names: ['github', 'urls[GitHub]', 'github_url', 'githubUrl']
  },
  portfolio: {
    keywords: ['portfolio', 'website', 'personal website', 'portfolio url'],
    names: ['portfolio', 'urls[Portfolio]', 'website', 'portfolioUrl']
  },
  address: {
    keywords: ['address', 'street address', 'street'],
    names: ['address', 'street', 'street_address', 'streetAddress']
  },
  city: {
    keywords: ['city', 'town'],
    names: ['city', 'town']
  },
  state: {
    keywords: ['state', 'province', 'region'],
    names: ['state', 'province', 'region']
  },
  zip: {
    keywords: ['zip', 'postal code', 'zipcode', 'postcode'],
    names: ['zip', 'zipcode', 'postal_code', 'postalCode', 'postcode']
  },
  country: {
    keywords: ['country'],
    names: ['country']
  },
  coverLetter: {
    keywords: ['cover letter', 'covering letter', 'why are you interested', 'tell us about yourself'],
    names: ['cover_letter', 'coverLetter', 'cover_letter_text', 'summary']
  },
  resume: {
    keywords: ['resume', 'cv', 'curriculum vitae', 'upload resume'],
    names: ['resume', 'cv', 'resume_file', 'resumeFile']
  }
};

/**
 * Match input field to field type
 * @param {HTMLElement} input
 * @returns {string|null} Field type key
 */
export function matchFieldType(input) {
  const name = input.name || '';
  const id = input.id || '';
  const type = input.type || '';
  const label = getLabelText(input) || '';

  const normalizedName = normalizeText(name);
  const normalizedId = normalizeText(id);
  const normalizedLabel = normalizeText(label);

  // Check file input for resume
  if (type === 'file') {
    for (const [fieldType, config] of Object.entries(FIELD_TYPES)) {
      if (fieldType === 'resume') {
        const matchesName = config.names.some(n => name.includes(n));
        const matchesLabel = config.keywords.some(k => normalizedLabel.includes(k));
        if (matchesName || matchesLabel) return fieldType;
      }
    }
    return null;
  }

  // Priority 1: Exact name match
  for (const [fieldType, config] of Object.entries(FIELD_TYPES)) {
    if (config.names.includes(name)) {
      return fieldType;
    }
  }

  // Priority 2: Partial name match
  for (const [fieldType, config] of Object.entries(FIELD_TYPES)) {
    if (config.names.some(n => normalizedName.includes(normalizeText(n)))) {
      return fieldType;
    }
  }

  // Priority 3: Label keyword match
  for (const [fieldType, config] of Object.entries(FIELD_TYPES)) {
    if (config.keywords.some(k => normalizedLabel.includes(k))) {
      return fieldType;
    }
  }

  // Priority 4: ID match
  for (const [fieldType, config] of Object.entries(FIELD_TYPES)) {
    if (config.names.some(n => normalizedId.includes(normalizeText(n)))) {
      return fieldType;
    }
  }

  return null;
}

/**
 * Map all form fields to their types
 * @param {HTMLFormElement} form
 * @returns {Map<string, HTMLElement>} Map of field type to input element
 */
export function mapFormFields(form) {
  const fieldMap = new Map();

  // Get all inputs, textareas, selects
  const fields = form.querySelectorAll('input, textarea, select');

  fields.forEach(field => {
    // Skip certain types
    if (field.type === 'submit' || field.type === 'button' || field.type === 'hidden') {
      return;
    }

    // Skip EEO/demographic fields (common patterns)
    const name = field.name || '';
    const label = getLabelText(field) || '';
    const eeoPatterns = ['gender', 'race', 'ethnicity', 'veteran', 'disability', 'demographic'];
    if (eeoPatterns.some(p => name.toLowerCase().includes(p) || label.toLowerCase().includes(p))) {
      if (DEBUG) {
        console.log('[Field Mapper] Skipping EEO field:', name, label);
      }
      return;
    }

    const fieldType = matchFieldType(field);
    if (fieldType) {
      // Don't overwrite if already mapped (prefer first occurrence)
      if (!fieldMap.has(fieldType)) {
        fieldMap.set(fieldType, field);
        if (DEBUG) {
          console.log(`[Field Mapper] Mapped ${fieldType}:`, field.name, '|', getLabelText(field));
        }
      }
    }
  });

  return fieldMap;
}

/**
 * Fill field with value, handling different input types
 * @param {HTMLElement} field
 * @param {string|number} value
 * @returns {boolean} Success
 */
export function fillField(field, value) {
  if (!field || !value) return false;

  try {
    const tagName = field.tagName.toLowerCase();
    const inputType = field.type ? field.type.toLowerCase() : '';

    if (tagName === 'select') {
      // Handle select dropdowns
      const option = Array.from(field.options).find(opt =>
        opt.value === value ||
        opt.text.toLowerCase().includes(value.toLowerCase())
      );
      if (option) {
        field.value = option.value;
        field.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    } else if (tagName === 'textarea' || tagName === 'input') {
      // Set value
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      ).set;
      const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      ).set;

      if (tagName === 'input') {
        nativeInputValueSetter.call(field, value);
      } else {
        nativeTextAreaValueSetter.call(field, value);
      }

      // Trigger events for React/Vue compatibility
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      field.dispatchEvent(new Event('blur', { bubbles: true }));

      return true;
    }

    return false;
  } catch (error) {
    console.error('[Field Mapper] Fill error:', error);
    return false;
  }
}

/**
 * Autofill form with profile data
 * @param {Map<string, HTMLElement>} fieldMap
 * @param {Object} profile - Autofill profile data
 * @returns {Object} Results { filled: number, failed: string[] }
 */
export function autofillForm(fieldMap, profile) {
  const results = {
    filled: 0,
    failed: []
  };

  // Map profile fields to form fields
  const mappings = {
    firstName: profile.first_name,
    lastName: profile.last_name,
    fullName: `${profile.first_name} ${profile.last_name}`.trim(),
    email: profile.email,
    phone: profile.phone,
    linkedin: profile.linkedin,
    github: profile.github,
    portfolio: profile.portfolio,
    address: profile.address,
    city: profile.city,
    state: profile.state,
    zip: profile.zip,
    country: profile.country
  };

  for (const [fieldType, value] of Object.entries(mappings)) {
    if (!value) continue; // Skip empty values

    const field = fieldMap.get(fieldType);
    if (field) {
      const success = fillField(field, value);
      if (success) {
        results.filled++;
        if (DEBUG) {
          console.log(`[Autofill] Filled ${fieldType}:`, value);
        }
      } else {
        results.failed.push(fieldType);
      }
    }
  }

  return results;
}

/**
 * Extract job description text from page
 * @returns {string} Job description text
 */
export function extractJobDescription() {
  // Common selectors for job description content
  const selectors = [
    '.job-description',
    '.description',
    '[class*="job-desc"]',
    '[class*="description"]',
    '#job-description',
    '#description',
    'article',
    'main'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.length > 200) {
      return element.textContent.trim();
    }
  }

  // Fallback: get all visible text from main content
  const main = document.querySelector('main') || document.body;
  return main.textContent.trim();
}

/**
 * Get metadata for textarea fields (for AI suggestions)
 * @param {HTMLTextAreaElement} field
 * @returns {Object}
 */
export function getFieldMetadata(field) {
  return {
    label: getLabelText(field) || 'Untitled field',
    name: field.name,
    maxLength: field.maxLength > 0 ? field.maxLength : null,
    placeholder: field.placeholder || null,
    required: field.required
  };
}
