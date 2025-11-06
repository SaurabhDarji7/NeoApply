/**
 * Auto-Fill Engine
 * Handles the complete autofill workflow with human-like behavior
 */

export class AutoFillEngine {
  constructor() {
    this.DEBUG = true;
    this.TYPING_DELAY_MIN = 30; // ms per character (min)
    this.TYPING_DELAY_MAX = 80; // ms per character (max)
    this.FIELD_DELAY_MIN = 100; // ms between fields (min)
    this.FIELD_DELAY_MAX = 300; // ms between fields (max)
  }

  /**
   * STEP-BY-STEP AUTO-FILL ALGORITHM
   *
   * 1. Validate form and profile data
   * 2. Map fields to profile values
   * 3. Sort fields by DOM order (top-to-bottom)
   * 4. Fill each field with human-like timing
   * 5. Trigger proper events for framework compatibility
   * 6. Validate filled data
   * 7. Return detailed results
   */
  async autoFill(form, profile, options = {}) {
    const {
      humanLike = true,      // Add typing delays
      validateAfter = true,  // Validate after filling
      scrollIntoView = true, // Scroll to fields
      focus = true          // Focus each field before filling
    } = options;

    this.log('🚀 Starting autofill process...');
    this.log('📋 Profile data:', Object.keys(profile));

    // STEP 1: Validate inputs
    if (!form || !profile) {
      throw new Error('Form and profile are required');
    }

    const results = {
      filled: [],
      failed: [],
      skipped: [],
      fileUploads: [],
      totalFields: 0,
      startTime: Date.now()
    };

    try {
      // STEP 2: Import field mapper and detect fields
      const { EnhancedFieldMapper } = await import('./enhanced-field-mapper.js');
      const mapper = new EnhancedFieldMapper();
      const { mappings, unmapped } = mapper.mapFields(form, profile);

      results.totalFields = mappings.size + unmapped.length;
      this.log(`📊 Mapped ${mappings.size} fields, ${unmapped.length} unmapped`);

      // STEP 3: Sort fields by DOM order (top to bottom, left to right)
      const sortedFields = this.sortFieldsByDOMOrder(Array.from(mappings.keys()));

      // STEP 4: Fill each field sequentially
      for (const field of sortedFields) {
        const match = mappings.get(field);

        try {
          // Handle file uploads separately
          if (field.type === 'file') {
            results.fileUploads.push({
              field,
              name: mapper.getFieldIdentifier(field)
            });
            this.log('📎 File upload detected:', field.name);
            continue;
          }

          // Scroll field into view
          if (scrollIntoView) {
            field.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(200);
          }

          // Focus field
          if (focus) {
            field.focus();
            await this.delay(50);
          }

          // Fill the field
          const success = await this.fillField(field, match.value, humanLike);

          if (success) {
            results.filled.push({
              field,
              key: match.key,
              value: match.value,
              confidence: match.confidence
            });
            this.log('✅ Filled:', field.name || field.id, '=', match.value);
          } else {
            results.failed.push({
              field,
              key: match.key,
              reason: 'Fill operation failed'
            });
            this.log('❌ Failed:', field.name || field.id);
          }

          // Human-like delay between fields
          if (humanLike) {
            const delay = this.randomDelay(this.FIELD_DELAY_MIN, this.FIELD_DELAY_MAX);
            await this.delay(delay);
          }

        } catch (error) {
          results.failed.push({
            field,
            key: match.key,
            reason: error.message
          });
          this.log('❌ Error filling field:', error);
        }
      }

      // STEP 5: Validate filled data
      if (validateAfter) {
        await this.validateFilledFields(results.filled);
      }

      // STEP 6: Mark unmapped fields as skipped
      results.skipped = unmapped.map(field => ({
        field,
        name: mapper.getFieldIdentifier(field),
        reason: 'No matching profile data'
      }));

    } catch (error) {
      this.log('❌ Autofill error:', error);
      throw error;
    }

    results.endTime = Date.now();
    results.duration = results.endTime - results.startTime;

    this.log('✨ Autofill complete!', {
      filled: results.filled.length,
      failed: results.failed.length,
      skipped: results.skipped.length,
      duration: `${results.duration}ms`
    });

    return results;
  }

  /**
   * Fill a single field with proper event handling
   */
  async fillField(field, value, humanLike = false) {
    const tagName = field.tagName.toLowerCase();
    const fieldType = field.type;

    try {
      if (tagName === 'select') {
        return this.fillSelect(field, value);
      } else if (tagName === 'textarea' || (tagName === 'input' && ['text', 'email', 'tel', 'url', 'search'].includes(fieldType))) {
        return await this.fillTextInput(field, value, humanLike);
      } else if (tagName === 'input' && fieldType === 'checkbox') {
        return this.fillCheckbox(field, value);
      } else if (tagName === 'input' && fieldType === 'radio') {
        return this.fillRadio(field, value);
      } else if (field.contentEditable === 'true') {
        return await this.fillContentEditable(field, value, humanLike);
      } else {
        this.log('⚠️ Unsupported field type:', tagName, fieldType);
        return false;
      }
    } catch (error) {
      this.log('❌ Error in fillField:', error);
      return false;
    }
  }

  /**
   * Fill text input or textarea with typing simulation
   */
  async fillTextInput(field, value, humanLike = false) {
    // Clear existing value
    field.value = '';
    this.triggerEvent(field, 'focus');

    if (humanLike) {
      // Type character by character
      for (let i = 0; i < value.length; i++) {
        field.value += value[i];
        this.triggerEvent(field, 'input');

        const delay = this.randomDelay(this.TYPING_DELAY_MIN, this.TYPING_DELAY_MAX);
        await this.delay(delay);
      }
    } else {
      // Set all at once
      field.value = value;
      this.triggerEvent(field, 'input');
    }

    // Trigger change and blur events
    this.triggerEvent(field, 'change');
    this.triggerEvent(field, 'blur');

    return true;
  }

  /**
   * Fill contentEditable element (rich text editors)
   */
  async fillContentEditable(element, value, humanLike = false) {
    element.focus();

    if (humanLike) {
      element.textContent = '';
      for (let i = 0; i < value.length; i++) {
        element.textContent += value[i];
        this.triggerEvent(element, 'input');

        const delay = this.randomDelay(this.TYPING_DELAY_MIN, this.TYPING_DELAY_MAX);
        await this.delay(delay);
      }
    } else {
      element.textContent = value;
      this.triggerEvent(element, 'input');
    }

    this.triggerEvent(element, 'change');
    this.triggerEvent(element, 'blur');

    return true;
  }

  /**
   * Fill select dropdown
   */
  fillSelect(select, value) {
    const options = Array.from(select.options);

    // Try exact value match first
    let option = options.find(opt => opt.value === value);

    // Try case-insensitive text match
    if (!option) {
      const valueLower = value.toString().toLowerCase();
      option = options.find(opt => opt.text.toLowerCase() === valueLower);
    }

    // Try partial match
    if (!option) {
      const valueLower = value.toString().toLowerCase();
      option = options.find(opt =>
        opt.text.toLowerCase().includes(valueLower) ||
        valueLower.includes(opt.text.toLowerCase())
      );
    }

    if (option) {
      select.value = option.value;
      this.triggerEvent(select, 'change');
      this.triggerEvent(select, 'blur');
      return true;
    }

    this.log('⚠️ No matching option found for:', value, 'in', select.name);
    return false;
  }

  /**
   * Fill checkbox
   */
  fillCheckbox(checkbox, value) {
    const shouldCheck = value === true || value === 'true' || value === '1' || value === 'yes';

    if (checkbox.checked !== shouldCheck) {
      checkbox.checked = shouldCheck;
      this.triggerEvent(checkbox, 'change');
      this.triggerEvent(checkbox, 'click');
    }

    return true;
  }

  /**
   * Fill radio button
   */
  fillRadio(radio, value) {
    // Find radio group
    const name = radio.name;
    const radios = document.querySelectorAll(`input[type="radio"][name="${name}"]`);

    for (const r of radios) {
      if (r.value === value || r.id === value) {
        r.checked = true;
        this.triggerEvent(r, 'change');
        this.triggerEvent(r, 'click');
        return true;
      }
    }

    return false;
  }

  /**
   * Trigger DOM event (React/Vue compatible)
   */
  triggerEvent(element, eventType) {
    // Create native events that React/Vue can detect
    let event;

    if (eventType === 'input' || eventType === 'change') {
      event = new Event(eventType, { bubbles: true, cancelable: true });
    } else if (eventType === 'focus' || eventType === 'blur') {
      event = new FocusEvent(eventType, { bubbles: true });
    } else if (eventType === 'click') {
      event = new MouseEvent(eventType, { bubbles: true, cancelable: true });
    } else {
      event = new Event(eventType, { bubbles: true });
    }

    // Set value descriptor (for React)
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

    if (valueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter?.call(element, element.value);
    }

    element.dispatchEvent(event);
  }

  /**
   * Sort fields by their position in the DOM (top-to-bottom, left-to-right)
   */
  sortFieldsByDOMOrder(fields) {
    return fields.sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();

      // Sort by Y position first (top to bottom)
      if (Math.abs(rectA.top - rectB.top) > 10) {
        return rectA.top - rectB.top;
      }

      // Then by X position (left to right)
      return rectA.left - rectB.left;
    });
  }

  /**
   * Validate filled fields
   */
  async validateFilledFields(filledFields) {
    for (const item of filledFields) {
      const { field, value } = item;

      // Check if value is still there
      if (field.value !== value && field.textContent !== value) {
        this.log('⚠️ Validation failed for:', field.name, 'Expected:', value, 'Got:', field.value);
        item.validated = false;
      } else {
        item.validated = true;
      }

      // Check HTML5 validation
      if (field.checkValidity && !field.checkValidity()) {
        this.log('⚠️ HTML5 validation failed for:', field.name);
        item.valid = false;
      } else {
        item.valid = true;
      }
    }
  }

  /**
   * Random delay for human-like behavior
   */
  randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Promise-based delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  log(...args) {
    if (this.DEBUG) {
      console.log('[AutoFillEngine]', ...args);
    }
  }
}
