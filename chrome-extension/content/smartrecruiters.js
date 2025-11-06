/**
 * SmartRecruiters ATS Content Script
 *
 * SmartRecruiters is a modern ATS with a focus on candidate experience.
 * Handles job applications on jobs.smartrecruiters.com.
 *
 * Common patterns:
 * - React-based single-page application
 * - Clean, modern UI
 * - Progressive form (shows/hides sections)
 * - Uses class-based selectors
 */

import {
  CommonUtils,
  PanelUI,
  UniversalFormDetector,
  EnhancedFieldMapper,
  AutoFillEngine
} from './common.js';

class SmartRecruitersApplicationHandler {
  constructor() {
    this.ATS_TYPE = 'SmartRecruiters';
    this.detector = new UniversalFormDetector();
    this.mapper = new EnhancedFieldMapper();
    this.engine = new AutoFillEngine();
    this.panel = null;
    this.currentForm = null;
  }

  /**
   * SmartRecruiters-specific selectors
   */
  SR_SELECTORS = {
    form: '[class*="ApplicationForm"], [class*="application-form"]',
    firstName: 'input[name="firstName"], input[id*="firstName"]',
    lastName: 'input[name="lastName"], input[id*="lastName"]',
    email: 'input[name="email"], input[type="email"]',
    phone: 'input[name="phoneNumber"], input[type="tel"]',
    location: 'input[name="location"]',
    resume: 'input[type="file"][accept*="pdf"]'
  };

  /**
   * Initialize SmartRecruiters handler
   */
  async init() {
    console.log('[NeoApply SmartRecruiters] Initializing...');

    // React app needs time to load
    await CommonUtils.delay(1500);

    await this.detectAndInit();

    // Observe for dynamic content
    this.observePageChanges();

    // Listen for messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sendResponse);
      return true;
    });
  }

  /**
   * Detect SmartRecruiters form and initialize UI
   */
  async detectAndInit() {
    console.log('[NeoApply SmartRecruiters] Detecting application form...');

    // Try SmartRecruiters-specific selectors first
    this.currentForm = document.querySelector(this.SR_SELECTORS.form);

    if (!this.currentForm) {
      // Fallback to generic detection
      const detection = this.detector.detectApplicationForm();
      if (detection) {
        this.currentForm = detection.form;
      }
    }

    if (!this.currentForm) {
      console.log('[NeoApply SmartRecruiters] No application form detected');
      return;
    }

    console.log('[NeoApply SmartRecruiters] ✅ Form detected');

    // Check for progressive sections
    const wizardState = this.detectProgressiveForm();

    // Inject panel
    await this.injectPanel(wizardState);
  }

  /**
   * Detect progressive form (sections that expand)
   */
  detectProgressiveForm() {
    const sections = document.querySelectorAll('[class*="FormSection"], [class*="form-section"]');

    if (sections.length > 1) {
      return {
        isWizard: false, // Not a true wizard, but has sections
        sections: sections.length
      };
    }

    return { isWizard: false };
  }

  /**
   * Inject autofill panel
   */
  async injectPanel(wizardState) {
    const panelUI = new PanelUI({
      atsType: this.ATS_TYPE,
      wizardState
    });

    await panelUI.inject();
    this.panel = panelUI.panel;

    // Attach autofill handler
    const autofillBtn = this.panel.querySelector('#neoapply-autofill-btn');
    autofillBtn?.addEventListener('click', () => this.handleAutofill());

    // Update stats
    const profile = await CommonUtils.getProfile();
    if (profile) {
      await panelUI.updateFieldStats(this.currentForm, profile);
    }
  }

  /**
   * Handle autofill click
   */
  async handleAutofill() {
    console.log('[NeoApply SmartRecruiters] Starting autofill...');

    const btn = this.panel?.querySelector('#neoapply-autofill-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="neoapply-btn-icon">⏳</span> Filling...';
    }

    try {
      const profile = await CommonUtils.getProfile();

      if (!profile) {
        CommonUtils.showStatus('error', 'Please set up your profile in settings first.');
        return;
      }

      // Run autofill
      const results = await this.engine.autoFill(this.currentForm, profile, {
        humanLike: true,
        validateAfter: true,
        scrollIntoView: true,
        focus: true
      });

      // Show results
      const message = `✅ Filled ${results.filled.length} fields successfully!`;
      CommonUtils.showStatus('success', message);

      // Handle file uploads
      if (results.fileUploads.length > 0) {
        CommonUtils.highlightFileUploads(results.fileUploads);
        CommonUtils.showStatus('info', `📎 Please attach your resume`, 10000);
      }

      // Log application
      await CommonUtils.logApplication({ atsType: this.ATS_TYPE });

    } catch (error) {
      console.error('[NeoApply SmartRecruiters] Autofill error:', error);
      CommonUtils.showStatus('error', 'Auto-fill failed: ' + error.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span class="neoapply-btn-icon">⚡</span> Auto-Fill Form';
      }
    }
  }

  /**
   * Observe page changes
   */
  observePageChanges() {
    const observer = new MutationObserver(() => {
      clearTimeout(this.observeTimeout);
      this.observeTimeout = setTimeout(() => {
        if (!this.currentForm || !document.contains(this.currentForm)) {
          console.log('[NeoApply SmartRecruiters] Form changed, re-detecting...');
          this.detectAndInit();
        }
      }, 1000);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Handle messages from extension
   */
  async handleMessage(message, sendResponse) {
    switch (message.type) {
      case 'PING':
        sendResponse({ status: 'ok', hasForm: !!this.currentForm, atsType: this.ATS_TYPE });
        break;

      case 'TRIGGER_AUTOFILL':
        await this.handleAutofill();
        sendResponse({ status: 'ok' });
        break;

      case 'GET_FORM_INFO':
        sendResponse({
          hasForm: !!this.currentForm,
          atsType: this.ATS_TYPE,
          isWizard: false
        });
        break;

      default:
        sendResponse({ status: 'unknown_message_type' });
    }
  }
}

// Initialize when script loads
const handler = new SmartRecruitersApplicationHandler();
handler.init();

console.log('[NeoApply SmartRecruiters] Content script loaded ✅');
