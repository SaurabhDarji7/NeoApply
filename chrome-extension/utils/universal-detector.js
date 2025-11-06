/**
 * Universal Form Detector
 * Works on any job application site using heuristics
 */

export class UniversalFormDetector {
  constructor() {
    this.DEBUG = true;
    this.FORM_INDICATORS = [
      'application', 'apply', 'job', 'career', 'candidate',
      'resume', 'cv', 'employment', 'recruit', 'hiring'
    ];
  }

  /**
   * Detect if current page is a job application form
   * @returns {Object|null} { form: HTMLElement, confidence: number }
   */
  detectApplicationForm() {
    const forms = this.findAllForms();

    if (forms.length === 0) {
      this.log('No forms found on page');
      return null;
    }

    // Score each form based on job application indicators
    const scoredForms = forms.map(form => ({
      form,
      score: this.scoreForm(form)
    }));

    // Sort by score (highest first)
    scoredForms.sort((a, b) => b.score - a.score);

    const best = scoredForms[0];

    if (best.score > 3) {
      this.log(`✅ Application form detected (confidence: ${best.score})`);
      return { form: best.form, confidence: best.score };
    }

    this.log(`❌ No clear application form (best score: ${best.score})`);
    return null;
  }

  /**
   * Find all forms including those in Shadow DOM and iframes
   */
  findAllForms() {
    const forms = [];

    // 1. Regular DOM forms
    forms.push(...document.querySelectorAll('form'));

    // 2. Shadow DOM forms (e.g., Web Components)
    this.findInShadowDOM(document.body, forms);

    // 3. iframes (same-origin only)
    try {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            forms.push(...iframeDoc.querySelectorAll('form'));
          }
        } catch (e) {
          this.log('⚠️ Cross-origin iframe, skipping:', e.message);
        }
      });
    } catch (e) {
      this.log('Error accessing iframes:', e);
    }

    // 4. Formless pages (React apps without <form>)
    if (forms.length === 0) {
      const implicitForm = this.findImplicitForm();
      if (implicitForm) forms.push(implicitForm);
    }

    return forms;
  }

  /**
   * Recursively search Shadow DOM
   */
  findInShadowDOM(root, forms = []) {
    if (!root) return;

    if (root.shadowRoot) {
      forms.push(...root.shadowRoot.querySelectorAll('form'));
      root.shadowRoot.querySelectorAll('*').forEach(el => {
        this.findInShadowDOM(el, forms);
      });
    }

    if (root.querySelectorAll) {
      root.querySelectorAll('*').forEach(el => {
        this.findInShadowDOM(el, forms);
      });
    }
  }

  /**
   * Some React apps don't use <form> tag
   * Find container with multiple inputs instead
   */
  findImplicitForm() {
    const containers = document.querySelectorAll('div[class*="form"], div[class*="application"], main, section');

    for (const container of containers) {
      const inputs = container.querySelectorAll('input, textarea, select');
      if (inputs.length >= 5) {
        // Has enough inputs to be a form
        this.log('📝 Found implicit form container:', container);
        return container;
      }
    }

    return null;
  }

  /**
   * Score a form based on job application indicators
   * Higher score = more likely to be application form
   */
  scoreForm(form) {
    let score = 0;

    // Check form attributes
    const formHTML = form.outerHTML.toLowerCase();
    const formText = form.textContent?.toLowerCase() || '';

    // 1. Form ID/class contains keywords (+3 points each)
    this.FORM_INDICATORS.forEach(keyword => {
      if ((form.id + form.className).toLowerCase().includes(keyword)) {
        score += 3;
      }
    });

    // 2. Action URL contains keywords (+2 points)
    const action = form.getAttribute('action') || '';
    if (this.FORM_INDICATORS.some(kw => action.toLowerCase().includes(kw))) {
      score += 2;
    }

    // 3. Has common application fields (+1 each)
    const hasNameField = form.querySelector('input[name*="name"], input[placeholder*="name"]');
    const hasEmailField = form.querySelector('input[type="email"], input[name*="email"]');
    const hasPhoneField = form.querySelector('input[type="tel"], input[name*="phone"]');
    const hasResumeField = form.querySelector('input[type="file"][accept*="pdf"], input[name*="resume"], input[name*="cv"]');

    if (hasNameField) score += 1;
    if (hasEmailField) score += 1;
    if (hasPhoneField) score += 1;
    if (hasResumeField) score += 2; // Resume upload is strong signal

    // 4. Text content mentions application (+1)
    if (formText.includes('apply') || formText.includes('application')) {
      score += 1;
    }

    // 5. Submit button text (+2)
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submitBtn) {
      const btnText = (submitBtn.textContent || submitBtn.value || '').toLowerCase();
      if (btnText.includes('apply') || btnText.includes('submit application')) {
        score += 2;
      }
    }

    // 6. Has many fields (+1)
    const fieldCount = form.querySelectorAll('input, textarea, select').length;
    if (fieldCount >= 10) score += 1;
    if (fieldCount >= 20) score += 1;

    return score;
  }

  /**
   * Detect multi-step wizard forms
   */
  detectWizard() {
    const indicators = [
      'step', 'wizard', 'progress', 'stage',
      'step 1 of', 'page 1 of', '1/5', '1 / 5'
    ];

    const bodyText = document.body.textContent.toLowerCase();
    const hasIndicator = indicators.some(ind => bodyText.includes(ind));

    if (hasIndicator) {
      // Look for progress bar or step counter
      const progressBar = document.querySelector('[role="progressbar"], .progress, .stepper, [class*="progress"]');
      const stepCounter = document.querySelector('[class*="step"], [class*="wizard"]');

      return {
        isWizard: true,
        currentStep: this.extractCurrentStep(),
        totalSteps: this.extractTotalSteps(),
        progressElement: progressBar || stepCounter
      };
    }

    return { isWizard: false };
  }

  extractCurrentStep() {
    // Match patterns like "Step 1 of 5", "1/5", "Page 1"
    const text = document.body.textContent;
    const matches = text.match(/(?:step|page)\s*(\d+)/i) || text.match(/(\d+)\s*\/\s*\d+/);
    return matches ? parseInt(matches[1]) : 1;
  }

  extractTotalSteps() {
    const text = document.body.textContent;
    const matches = text.match(/(?:of|\/)\s*(\d+)/);
    return matches ? parseInt(matches[1]) : null;
  }

  /**
   * Find "Next" or "Continue" button for wizard navigation
   */
  findNextButton() {
    const candidates = [
      'button:not([type="submit"]):not([type="button"][onclick])',
      'button[type="button"]',
      'a.btn, a.button'
    ];

    for (const selector of candidates) {
      const buttons = document.querySelectorAll(selector);
      for (const btn of buttons) {
        const text = (btn.textContent || btn.value || '').toLowerCase().trim();
        if (['next', 'continue', 'proceed', 'save and continue'].includes(text)) {
          return btn;
        }
      }
    }

    return null;
  }

  log(...args) {
    if (this.DEBUG) {
      console.log('[UniversalDetector]', ...args);
    }
  }
}
