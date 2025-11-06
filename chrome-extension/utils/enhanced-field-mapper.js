/**
 * Enhanced Field Mapper with Fuzzy Matching & Synonym Support
 * Handles international labels, variations, and multi-language sites
 */

export class EnhancedFieldMapper {
  constructor() {
    this.DEBUG = true;

    // Comprehensive synonym mapping
    this.FIELD_SYNONYMS = {
      firstName: [
        'first name', 'first_name', 'firstname', 'fname',
        'given name', 'givenname', 'forename',
        'prénom', 'nombre', 'vorname' // French, Spanish, German
      ],
      lastName: [
        'last name', 'last_name', 'lastname', 'lname',
        'surname', 'family name', 'familyname',
        'nom', 'apellido', 'nachname'
      ],
      fullName: [
        'full name', 'full_name', 'fullname', 'name',
        'your name', 'complete name',
        'nom complet', 'nombre completo'
      ],
      email: [
        'email', 'e-mail', 'email address', 'email_address',
        'mail', 'electronic mail',
        'correo electrónico', 'courriel'
      ],
      phone: [
        'phone', 'phone number', 'phone_number', 'phonenumber',
        'telephone', 'tel', 'mobile', 'cell',
        'contact number', 'contact_number',
        'téléphone', 'teléfono', 'telefon'
      ],
      address: [
        'address', 'street address', 'street_address',
        'address line 1', 'address_line_1',
        'street', 'adresse', 'dirección'
      ],
      address2: [
        'address line 2', 'address_line_2',
        'apartment', 'apt', 'suite', 'unit',
        'building', 'floor'
      ],
      city: [
        'city', 'town', 'ville', 'ciudad', 'stadt'
      ],
      state: [
        'state', 'province', 'region',
        'state/province', 'état', 'estado'
      ],
      zip: [
        'zip', 'zip code', 'zipcode', 'zip_code',
        'postal code', 'postalcode', 'postal_code',
        'postcode', 'code postal', 'código postal'
      ],
      country: [
        'country', 'nation', 'pays', 'país', 'land'
      ],
      linkedin: [
        'linkedin', 'linkedin url', 'linkedin profile',
        'linkedin.com', 'linked in'
      ],
      github: [
        'github', 'github url', 'github profile',
        'github username', 'github.com'
      ],
      portfolio: [
        'portfolio', 'website', 'personal website',
        'personal site', 'portfolio url', 'portfolio link',
        'site web', 'sitio web'
      ],
      resume: [
        'resume', 'cv', 'curriculum vitae',
        'résumé', 'curriculum', 'lebenslauf'
      ],
      coverLetter: [
        'cover letter', 'coverletter', 'cover_letter',
        'lettre de motivation', 'carta de presentación'
      ]
    };

    // EEO/demographic fields to skip
    this.SKIP_PATTERNS = [
      'gender', 'sex', 'race', 'ethnicity', 'veteran',
      'disability', 'disabled', 'orientation', 'lgbtq',
      'pronouns', 'aboriginal', 'indigenous'
    ];
  }

  /**
   * Find and map all fillable fields in a form
   * @param {HTMLElement} form - The form element
   * @param {Object} profile - User's autofill profile data
   * @returns {Object} { mappings: Map, unmapped: Array }
   */
  mapFields(form, profile) {
    const fields = this.findAllFields(form);
    const mappings = new Map();
    const unmapped = [];

    this.log(`🔍 Found ${fields.length} fields in form`);

    for (const field of fields) {
      // Skip if disabled or readonly
      if (field.disabled || field.readOnly) continue;

      // Skip EEO fields
      if (this.isEEOField(field)) {
        this.log('⏭️  Skipping EEO field:', this.getFieldIdentifier(field));
        continue;
      }

      // Try to match field to profile data
      const match = this.matchField(field, profile);

      if (match) {
        mappings.set(field, match);
        this.log('✅ Mapped:', this.getFieldIdentifier(field), '→', match.key, '=', match.value);
      } else {
        unmapped.push(field);
        this.log('❌ Unmapped:', this.getFieldIdentifier(field));
      }
    }

    return { mappings, unmapped };
  }

  /**
   * Find all fillable fields (including Shadow DOM, iframes)
   */
  findAllFields(root) {
    const fields = [];
    const selectors = [
      'input:not([type="submit"]):not([type="button"]):not([type="hidden"])',
      'textarea',
      'select'
    ];

    // Regular DOM
    selectors.forEach(sel => {
      fields.push(...root.querySelectorAll(sel));
    });

    // Shadow DOM
    this.findInShadowDOM(root, fields);

    // iframes (same-origin)
    if (root === document.body || root === document) {
      try {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDoc) {
              selectors.forEach(sel => {
                fields.push(...iframeDoc.querySelectorAll(sel));
              });
            }
          } catch (e) {
            // Cross-origin, skip
          }
        });
      } catch (e) {
        this.log('Error accessing iframes:', e);
      }
    }

    return fields;
  }

  findInShadowDOM(root, fields) {
    if (!root) return;

    if (root.shadowRoot) {
      const selectors = [
        'input:not([type="submit"]):not([type="button"]):not([type="hidden"])',
        'textarea',
        'select'
      ];
      selectors.forEach(sel => {
        fields.push(...root.shadowRoot.querySelectorAll(sel));
      });

      root.shadowRoot.querySelectorAll('*').forEach(el => {
        this.findInShadowDOM(el, fields);
      });
    }

    if (root.querySelectorAll) {
      root.querySelectorAll('*').forEach(el => {
        if (el.shadowRoot) {
          this.findInShadowDOM(el, fields);
        }
      });
    }
  }

  /**
   * Match a field to profile data using fuzzy matching
   * @returns {Object|null} { key, value, confidence }
   */
  matchField(field, profile) {
    const identifier = this.getFieldIdentifier(field);
    const fieldType = field.type;

    // Skip file inputs (can't be auto-filled programmatically)
    if (fieldType === 'file') {
      return { key: 'resume', value: '[FILE_UPLOAD]', confidence: 1.0 };
    }

    // Try each profile key
    let bestMatch = null;
    let bestScore = 0;

    for (const [profileKey, profileValue] of Object.entries(profile)) {
      // Skip null/undefined values
      if (profileValue == null || profileValue === '') continue;

      const score = this.calculateMatchScore(field, identifier, profileKey);

      if (score > bestScore && score >= 0.5) {
        bestScore = score;
        bestMatch = {
          key: profileKey,
          value: profileValue,
          confidence: score
        };
      }
    }

    return bestMatch;
  }

  /**
   * Calculate match score between field and profile key
   * @returns {number} 0.0 to 1.0
   */
  calculateMatchScore(field, identifier, profileKey) {
    const synonyms = this.FIELD_SYNONYMS[profileKey] || [profileKey];
    const idLower = identifier.toLowerCase();
    const fieldType = field.type;

    let maxScore = 0;

    for (const synonym of synonyms) {
      const synLower = synonym.toLowerCase();

      // Exact match in name attribute (highest priority)
      if (field.name && field.name.toLowerCase() === synLower) {
        return 1.0;
      }

      // Exact match in ID
      if (field.id && field.id.toLowerCase() === synLower) {
        return 0.95;
      }

      // Contains synonym in name/id
      if (field.name && field.name.toLowerCase().includes(synLower)) {
        maxScore = Math.max(maxScore, 0.9);
      }
      if (field.id && field.id.toLowerCase().includes(synLower)) {
        maxScore = Math.max(maxScore, 0.85);
      }

      // Label text contains synonym
      if (idLower.includes(synLower)) {
        maxScore = Math.max(maxScore, 0.8);
      }

      // Partial match (fuzzy)
      const similarity = this.stringSimilarity(idLower, synLower);
      if (similarity > 0.7) {
        maxScore = Math.max(maxScore, similarity * 0.7);
      }
    }

    // Type validation (boost if type matches expected)
    if (profileKey === 'email' && fieldType === 'email') {
      maxScore *= 1.2;
    }
    if (profileKey === 'phone' && fieldType === 'tel') {
      maxScore *= 1.2;
    }
    if (profileKey === 'resume' && fieldType === 'file') {
      maxScore *= 1.5;
    }

    return Math.min(maxScore, 1.0);
  }

  /**
   * Levenshtein-based string similarity
   * @returns {number} 0.0 to 1.0
   */
  stringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get human-readable field identifier
   */
  getFieldIdentifier(field) {
    // Try in order: label text, aria-label, placeholder, name, id
    const label = this.getLabelText(field);
    if (label) return label;

    if (field.getAttribute('aria-label')) {
      return field.getAttribute('aria-label');
    }

    if (field.placeholder) {
      return field.placeholder;
    }

    if (field.name) return field.name;
    if (field.id) return field.id;

    return field.tagName.toLowerCase();
  }

  /**
   * Get associated label text for a field
   */
  getLabelText(field) {
    // 1. <label for="id">
    if (field.id) {
      const label = document.querySelector(`label[for="${field.id}"]`);
      if (label) return this.cleanText(label.textContent);
    }

    // 2. Parent <label>
    const parentLabel = field.closest('label');
    if (parentLabel) {
      return this.cleanText(parentLabel.textContent);
    }

    // 3. Previous sibling label
    let prev = field.previousElementSibling;
    while (prev) {
      if (prev.tagName === 'LABEL') {
        return this.cleanText(prev.textContent);
      }
      prev = prev.previousElementSibling;
    }

    // 4. aria-label
    if (field.getAttribute('aria-label')) {
      return field.getAttribute('aria-label');
    }

    // 5. aria-labelledby
    const labelledBy = field.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelEl = document.getElementById(labelledBy);
      if (labelEl) return this.cleanText(labelEl.textContent);
    }

    return null;
  }

  cleanText(text) {
    if (!text) return '';
    return text.replace(/[\*\:]/g, '').trim();
  }

  /**
   * Check if field is EEO/demographic (should skip)
   */
  isEEOField(field) {
    const identifier = this.getFieldIdentifier(field).toLowerCase();
    return this.SKIP_PATTERNS.some(pattern => identifier.includes(pattern));
  }

  log(...args) {
    if (this.DEBUG) {
      console.log('[EnhancedFieldMapper]', ...args);
    }
  }
}
